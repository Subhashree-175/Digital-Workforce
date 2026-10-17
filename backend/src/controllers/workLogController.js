const { query } = require('../config/db');
const { writeAudit } = require('../utils/audit');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../utils/asyncHandler');

const LOG_FIELDS = `
  wl.id, wl.employee_id, wl.kpi_id, wl.task_title, wl.task_details,
  wl.supporting_docs, wl.log_date, wl.status, wl.supervisor_remarks,
  wl.submitted_at, wl.reviewed_at, wl.reviewed_by,
  u.name AS employee_name, u.employee_code,
  rb.name AS reviewer_name,
  k.name AS kpi_name, k.unit AS kpi_unit
`;

exports.list = asyncHandler(async (req, res) => {
  let sql = `
    SELECT ${LOG_FIELDS}
    FROM work_logs wl
    JOIN users u ON u.id = wl.employee_id
    LEFT JOIN users rb ON rb.id = wl.reviewed_by
    LEFT JOIN kpis k ON k.id = wl.kpi_id
    WHERE 1=1`;
  const params = [];

  if (req.query?.employeeId) {
    params.push(req.query.employeeId);
    sql += ` AND wl.employee_id = $${params.length}`;
  } else if (req.user.role === 'employee') {
    params.push(req.user.id);
    sql += ` AND wl.employee_id = $${params.length}`;
  } else if (req.user.role === 'hod') {
    // HOD sees logs of their department's employees (direct reports)
    params.push(req.user.id);
    sql += ` AND (u.manager_id = $${params.length} OR u.department_id = (SELECT department_id FROM users WHERE id = $${params.length}))`;
  }
  if (req.query?.status) {
    params.push(req.query.status);
    sql += ` AND wl.status = $${params.length}`;
  }
  if (req.query?.fromDate) {
    params.push(req.query.fromDate);
    sql += ` AND wl.log_date >= $${params.length}`;
  }
  sql += ' ORDER BY wl.log_date DESC, wl.id DESC LIMIT 300';
  const result = await query(sql, params);
  res.json({ workLogs: result.rows });
});

exports.get = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT ${LOG_FIELDS} FROM work_logs wl
     JOIN users u ON u.id = wl.employee_id
     LEFT JOIN users rb ON rb.id = wl.reviewed_by
     LEFT JOIN kpis k ON k.id = wl.kpi_id
     WHERE wl.id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) throw new AppError('Work log not found.', 404);

  const log = result.rows[0];
  if (req.user.role === 'employee' && log.employee_id !== req.user.id) {
    throw new AppError('You can only view your own work logs.', 403);
  }
  res.json({ workLog: log });
});

exports.create = asyncHandler(async (req, res) => {
  const { kpiId, taskTitle, taskDetails, logDate } = req.body;

  // Collect uploaded files into supporting_docs
  const docs = (req.files || []).map((f) => ({
    fileName: f.originalname,
    filePath: `/uploads/${f.filename}`,
    fileSize: f.size,
    uploadedAt: new Date().toISOString(),
  }));

  const result = await query(
    `INSERT INTO work_logs (employee_id, kpi_id, task_title, task_details, supporting_docs, log_date)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE))
     RETURNING *`,
    [req.user.id, kpiId, taskTitle, taskDetails, JSON.stringify(docs), logDate]
  );
  await writeAudit(req.user.id, 'WORKLOG_SUBMIT', 'work_logs', result.rows[0].id, {
    taskTitle, fileCount: docs.length,
  });
  res.status(201).json({ workLog: result.rows[0], message: 'Work log submitted for approval.' });
});

exports.review = asyncHandler(async (req, res) => {
  const { decision, remarks } = req.body; // decision: 'approved' | 'rejected'

  const existing = await query(
    `SELECT wl.*, u.manager_id FROM work_logs wl
     JOIN users u ON u.id = wl.employee_id
     WHERE wl.id = $1`,
    [req.params.id]
  );
  if (existing.rows.length === 0) throw new AppError('Work log not found.', 404);
  const log = existing.rows[0];
  if (log.status !== 'pending') {
    throw new AppError(`Work log already ${log.status}.`, 400);
  }

  const isManager = req.user.role === 'admin' || log.manager_id === req.user.id;
  if (!isManager && req.user.role !== 'hod') {
    throw new AppError('Only the reporting manager/HOD can review this submission.', 403);
  }

  if (decision === 'rejected' && !remarks) {
    throw new AppError('Remarks are required when rejecting a submission.', 400);
  }

  const result = await query(
    `UPDATE work_logs
     SET status = $2, supervisor_remarks = $3, reviewed_by = $4, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [req.params.id, decision, remarks, req.user.id]
  );

  await writeAudit(req.user.id, `WORKLOG_${decision.toUpperCase()}`, 'work_logs', req.params.id, { remarks });
  res.json({ workLog: result.rows[0], message: `Work log ${decision}.` });
});

exports.reporteesWorkLogs = asyncHandler(async (req, res) => {
  // Convenience endpoint for HOD: pending submissions needing review
  const result = await query(
    `SELECT ${LOG_FIELDS}
     FROM work_logs wl
     JOIN users u ON u.id = wl.employee_id
     LEFT JOIN users rb ON rb.id = wl.reviewed_by
     LEFT JOIN kpis k ON k.id = wl.kpi_id
     WHERE wl.status = 'pending'
       AND (u.manager_id = $1 OR u.department_id = (SELECT department_id FROM users WHERE id = $1))
     ORDER BY wl.submitted_at ASC`,
    [req.user.id]
  );
  res.json({ workLogs: result.rows });
});
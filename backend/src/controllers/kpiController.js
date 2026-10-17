const { query } = require('../config/db');
const { writeAudit } = require('../utils/audit');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../utils/asyncHandler');
const { computeAchievementAndScore } = require('../utils/scoring');

exports.list = asyncHandler(async (req, res) => {
  let sql = `
    SELECT k.*, d.name AS department_name,
           (SELECT COUNT(*) FROM kpi_assignments ka WHERE ka.kpi_id = k.id) AS assignment_count
    FROM kpis k
    LEFT JOIN departments d ON d.id = k.department_id
    WHERE 1=1`;
  const params = [];

  if (req.user.role === 'hod') {
    params.push(req.user.departmentId);
    sql += ` AND (k.department_id = $${params.length} OR k.department_id IS NULL)`;
  }
  if (req.query?.departmentId) {
    params.push(req.query.departmentId);
    sql += ` AND k.department_id = $${params.length}`;
  }
  if (req.query?.active === 'true') sql += ' AND k.is_active = TRUE';
  sql += ' ORDER BY k.name';
  const result = await query(sql, params);
  res.json({ kpis: result.rows });
});

exports.get = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT k.*, d.name AS department_name FROM kpis k
     LEFT JOIN departments d ON d.id = k.department_id
     WHERE k.id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) throw new AppError('KPI not found.', 404);
  res.json({ kpi: result.rows[0] });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, description, departmentId, unit, defaultWeight, evaluationPeriod } = req.body;
  const result = await query(
    `INSERT INTO kpis (name, description, department_id, unit, default_weight, evaluation_period, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, description, departmentId, unit, defaultWeight, evaluationPeriod, req.user.id]
  );
  await writeAudit(req.user.id, 'KPI_CREATE', 'kpi', result.rows[0].id, { name });
  res.status(201).json({ kpi: result.rows[0] });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, description, departmentId, unit, defaultWeight, evaluationPeriod, isActive } = req.body;
  const result = await query(
    `UPDATE kpis SET name = COALESCE($1, name), description = COALESCE($2, description),
      department_id = COALESCE($3, department_id), unit = COALESCE($4, unit),
      default_weight = COALESCE($5, default_weight),
      evaluation_period = COALESCE($6, evaluation_period),
      is_active = COALESCE($7, is_active), updated_at = NOW()
     WHERE id = $8 RETURNING *`,
    [name, description, departmentId, unit, defaultWeight, evaluationPeriod, isActive, req.params.id]
  );
  if (result.rows.length === 0) throw new AppError('KPI not found.', 404);
  await writeAudit(req.user.id, 'KPI_UPDATE', 'kpi', req.params.id);
  res.json({ kpi: result.rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM kpis WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rows.length === 0) throw new AppError('KPI not found.', 404);
  await writeAudit(req.user.id, 'KPI_DELETE', 'kpi', req.params.id);
  res.json({ message: 'KPI deleted.' });
});

// ---------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------

exports.listAssignments = asyncHandler(async (req, res) => {
  let sql = `
    SELECT ka.id, ka.employee_id, ka.kpi_id, ka.target_value, ka.weight,
           ka.period_start, ka.period_end, ka.assigned_by, ka.created_at,
           k.name AS kpi_name, k.unit AS kpi_unit, k.description AS kpi_description,
           u.name AS employee_name, u.employee_code, d.name AS department_name
    FROM kpi_assignments ka
    JOIN kpis k ON k.id = ka.kpi_id
    JOIN users u ON u.id = ka.employee_id
    LEFT JOIN departments d ON d.id = u.department_id
    WHERE 1=1`;
  const params = [];

  if (req.query?.employeeId) {
    params.push(req.query.employeeId);
    sql += ` AND ka.employee_id = $${params.length}`;
  } else if (req.user.role === 'employee') {
    params.push(req.user.id);
    sql += ` AND ka.employee_id = $${params.length}`;
  } else if (req.user.role === 'hod') {
    params.push(req.user.departmentId);
    sql += ` AND u.department_id = $${params.length}`;
  }
  if (req.query?.periodStart) {
    params.push(req.query.periodStart);
    sql += ` AND ka.period_start >= $${params.length}`;
  }
  if (req.query?.periodEnd) {
    params.push(req.query.periodEnd);
    sql += ` AND ka.period_end <= $${params.length}`;
  }
  sql += ' ORDER BY ka.period_start DESC, k.name';
  const result = await query(sql, params);
  res.json({ assignments: result.rows });
});

exports.assign = asyncHandler(async (req, res) => {
  const { employeeId, kpiId, targetValue, weight, periodStart, periodEnd, assignedById } = req.body;

  // Auto-suggest default weight if not provided
  let w = weight;
  if (!w) {
    const kpiRes = await query('SELECT default_weight FROM kpis WHERE id = $1', [kpiId]);
    if (kpiRes.rows.length === 0) throw new AppError('KPI not found.', 404);
    w = kpiRes.rows[0].default_weight;
  }

  const result = await query(
    `INSERT INTO kpi_assignments (kpi_id, employee_id, target_value, weight, period_start, period_end, assigned_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (kpi_id, employee_id, period_start, period_end)
     DO UPDATE SET target_value = EXCLUDED.target_value, weight = EXCLUDED.weight,
                   assigned_by = EXCLUDED.assigned_by
     RETURNING *`,
    [kpiId, employeeId, targetValue, w, periodStart, periodEnd, assignedById || req.user.id]
  );
  await writeAudit(req.user.id, 'KPI_ASSIGN', 'kpi_assignments', result.rows[0].id, { employeeId, kpiId });
  res.status(201).json({ assignment: result.rows[0] });
});

exports.removeAssignment = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM kpi_assignments WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rows.length === 0) throw new AppError('Assignment not found.', 404);
  await writeAudit(req.user.id, 'KPI_ASSIGNMENT_DELETE', 'kpi_assignments', req.params.id);
  res.json({ message: 'Assignment removed.' });
});

/**
 * Evaluate a single achieved value against an assignment's target using the
 * standardized automated scoring formula.
 */
exports.previewScore = asyncHandler(async (req, res) => {
  const { achievedValue, targetValue, weight } = req.body;
  const { achievementPct, weightedScore } = computeAchievementAndScore(achievedValue, targetValue, weight);
  res.json({ achievementPct, weightedScore });
});
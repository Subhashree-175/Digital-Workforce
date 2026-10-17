const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../utils/asyncHandler');
const { ratingBand } = require('../utils/scoring');
require('dotenv').config();

const REPORT_TYPES = ['departments', 'performers', 'evaluations', 'audit'];
const EXPORT_FORMATS = ['csv', 'excel', 'pdf'];

// ---------------------------------------------------------------
// Data fetchers (role-aware)
// ---------------------------------------------------------------
async function fetchReportData(type, req) {
  const { departmentId, from, to } = req.query;

  if (type === 'departments') {
    let periodFilter = '';
    const params = [];
    if (from) { params.push(from); periodFilter += ` AND e.period_start >= $${params.length}`; }
    if (to) { params.push(to); periodFilter += ` AND e.period_end <= $${params.length}`; }
    const r = await query(
      `SELECT d.name AS department, d.code AS dept_code,
              COUNT(DISTINCT e.id) AS evaluations,
              COUNT(DISTINCT e.employee_id) AS employees_evaluated,
              ROUND(AVG(e.overall_score)::numeric, 2) AS avg_score,
              ROUND(AVG(es.achievement_pct)::numeric, 2) AS avg_achievement,
              COUNT(DISTINCT wl.id) AS worklogs_submitted,
              SUM(CASE WHEN wl.status = 'approved' THEN 1 ELSE 0 END) AS worklogs_approved
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id AND u.role = 'employee'
       LEFT JOIN evaluations e ON e.employee_id = u.id AND e.status = 'approved'${periodFilter}
       LEFT JOIN evaluation_scores es ON es.evaluation_id = e.id
       LEFT JOIN work_logs wl ON wl.employee_id = u.id
       GROUP BY d.name, d.code
       ORDER BY avg_score DESC NULLS LAST`,
      params
    );
    return r.rows.map((row) => ({
      Department: row.department,
      Code: row.dept_code,
      Evaluations: row.evaluations,
      EmployeesEvaluated: row.employees_evaluated,
      AvgScore: row.avg_score,
      AvgAchievementPct: row.avg_achievement,
      WorklogsSubmitted: row.worklogs_submitted,
      WorklogsApproved: row.worklogs_approved,
    }));
  }

  if (type === 'performers') {
    let filter = "WHERE e.status = 'approved'";
    const params = [];
    if (departmentId) {
      params.push(departmentId);
      filter += ` AND e.department_id = $${params.length}`;
    }
    const r = await query(
      `SELECT u.employee_code, u.name AS employee, u.designation, d.name AS department,
              e.period_start, e.period_end, e.overall_score
       FROM evaluations e
       JOIN users u ON u.id = e.employee_id
       LEFT JOIN departments d ON d.id = e.department_id
       ${filter}
       ORDER BY e.overall_score DESC NULLS LAST
       LIMIT 50`,
      params
    );
    return r.rows.map((row) => ({
      EmployeeCode: row.employee_code,
      Employee: row.employee,
      Designation: row.designation,
      Department: row.department,
      PeriodStart: row.period_start && row.period_start.toString(),
      PeriodEnd: row.period_end && row.period_end.toString(),
      OverallScore: row.overall_score,
    }));
  }

  if (type === 'evaluations') {
    let filter = 'WHERE 1=1';
    const params = [];
    if (req.user.role === 'employee') {
      params.push(req.user.id);
      filter += ` AND e.employee_id = $${params.length}`;
    } else if (req.user.role === 'hod') {
      params.push(req.user.id);
      filter += ` AND (u.manager_id = $${params.length} OR e.department_id = (SELECT department_id FROM users WHERE id = $${params.length}))`;
    }
    if (from) { params.push(from); filter += ` AND e.period_start >= $${params.length}`; }
    if (to) { params.push(to); filter += ` AND e.period_end <= $${params.length}`; }
    const r = await query(
      `SELECT u.employee_code, u.name AS employee, d.name AS department,
              e.period_start, e.period_end, e.status, e.overall_score, e.remarks
       FROM evaluations e
       JOIN users u ON u.id = e.employee_id
       LEFT JOIN departments d ON d.id = e.department_id
       ${filter}
       ORDER BY e.period_end DESC
       LIMIT 500`,
      params
    );
    return r.rows.map((row) => ({
      EmployeeCode: row.employee_code,
      Employee: row.employee,
      Department: row.department,
      PeriodStart: row.period_start && row.period_start.toString(),
      PeriodEnd: row.period_end && row.period_end.toString(),
      Status: row.status,
      OverallScore: row.overall_score,
      Rating: row.overall_score ? ratingBand(Number(row.overall_score), 100) : 'Not Rated',
      Remarks: row.remarks,
    }));
  }

  if (type === 'audit') {
    if (req.user.role !== 'admin') throw new AppError('Audit report requires admin role.', 403);
    const r = await query(
      `SELECT al.created_at, u.name AS user, u.email, al.action, al.entity_type, al.entity_id
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT 500`
    );
    return r.rows.map((row) => ({
      Timestamp: row.created_at && row.created_at.toString(),
      User: row.user,
      Email: row.email,
      Action: row.action,
      Entity: `${row.entity_type}#${row.entity_id}`,
    }));
  }

  throw new AppError('Unknown report type.', 400);
}

function toCsv(rows) {
  if (!rows || rows.length === 0) return 'No data found.\n';
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  rows.forEach((row) => lines.push(headers.map((h) => esc(row[h])).join(',')));
  return lines.join('\n');
}

module.exports = {
  REPORT_TYPES,
  EXPORT_FORMATS,
  fetchReportData,
  toCsv,
};
const { query } = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');
const { ratingBand } = require('../utils/scoring');

// ---------------------------------------------------------------
// Dashboard summary used by all roles (role-aware)
// ---------------------------------------------------------------
exports.summary = asyncHandler(async (req, res) => {
  const statusQ = req.user.role === 'employee'
    ? 'AND u.id = $1'
    : req.user.role === 'hod'
      ? 'AND (u.manager_id = $1 OR u.department_id = (SELECT department_id FROM users WHERE id = $1))'
      : '';
  const deptQ = req.user.role === 'hod'
    ? 'AND (u.department_id = (SELECT department_id FROM users WHERE id = $1) OR u.manager_id = $1)'
    : '';

  const params = req.user.role === 'employee' || req.user.role === 'hod' ? [req.user.id] : [];

  const result = await query(
    `SELECT
      (SELECT COUNT(*) FROM evaluations e JOIN users u ON u.id = e.employee_id
        WHERE e.status = 'approved' ${statusQ}) AS approved_evals,
      (SELECT COUNT(*) FROM evaluations e JOIN users u ON u.id = e.employee_id
        WHERE e.status = 'submitted' ${statusQ}) AS pending_evals,
      (SELECT COUNT(*) FROM work_logs wl JOIN users u ON u.id = wl.employee_id
        WHERE wl.status = 'pending' ${statusQ}) AS pending_worklogs,
      (SELECT COUNT(*) FROM kpi_assignments ka JOIN users u ON u.id = ka.employee_id
        WHERE ka.period_end >= CURRENT_DATE ${statusQ}) AS active_assignments,
      (SELECT COUNT(DISTINCT wl.employee_id) FROM work_logs wl JOIN users u ON u.id = wl.employee_id
        WHERE wl.status = 'approved' ${statusQ}) AS submitting_employees,
      (SELECT COUNT(*) FROM users u WHERE u.role = 'employee' AND u.is_active ${deptQ}) AS employee_count
    `,
    params
  );
  res.json({ summary: result.rows[0] });
});

// ---------------------------------------------------------------
// Department productivity monitoring (cross-department for admin)
// ---------------------------------------------------------------
exports.departmentProductivity = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  let periodFilter = '';
  const params = [];
  if (from) { params.push(from); periodFilter += ` AND e.period_start >= $${params.length}`; }
  if (to) { params.push(to); periodFilter += ` AND e.period_end <= $${params.length}`; }

  const result = await query(
    `SELECT d.id, d.name AS department_name, d.code,
       COUNT(DISTINCT e.id) AS evaluation_count,
       COUNT(DISTINCT e.employee_id) AS employees_evaluated,
       ROUND(AVG(e.overall_score)::numeric, 2) AS avg_overall_score,
       ROUND(AVG(es.achievement_pct)::numeric, 2) AS avg_kpi_achievement,
       SUM(CASE WHEN wl.status = 'approved' THEN 1 ELSE 0 END) AS approved_worklogs,
       COUNT(DISTINCT wl.id) AS total_worklogs
     FROM departments d
     LEFT JOIN users u ON u.department_id = d.id AND u.role = 'employee'
     LEFT JOIN evaluations e ON e.employee_id = u.id AND e.status = 'approved'${periodFilter}
     LEFT JOIN evaluation_scores es ON es.evaluation_id = e.id
     LEFT JOIN work_logs wl ON wl.employee_id = u.id
     GROUP BY d.id, d.name, d.code
     ORDER BY avg_overall_score DESC NULLS LAST`,
    params
  );

  const rows = result.rows.map((r) => ({
    ...r,
    rating: ratingBand(Number(r.avg_overall_score), 100),
  }));
  res.json({ departments: rows });
});

// ---------------------------------------------------------------
// KPI achievement trend (department or employee level)
// ---------------------------------------------------------------
exports.kpiAchievementTrend = asyncHandler(async (req, res) => {
  const { departmentId, employeeId, months } = req.query;
  const lookback = Math.min(Math.max(Number(months) || 6, 1), 24);

  let filter = 'WHERE 1=1';
  const params = [];

  if (employeeId) {
    params.push(employeeId);
    filter += ` AND u.id = $${params.length}`;
  }
  if (departmentId) {
    params.push(departmentId);
    filter += ` AND u.department_id = $${params.length}`;
  }

  const result = await query(
    `SELECT TO_CHAR(e.period_end, 'YYYY-MM') AS period,
            ROUND(AVG(es.achievement_pct)::numeric, 2) AS avg_achievement,
            ROUND(AVG(e.overall_score)::numeric, 2) AS avg_score,
            COUNT(DISTINCT e.id) AS evals
     FROM evaluations e
     JOIN evaluation_scores es ON es.evaluation_id = e.id
     JOIN users u ON u.id = e.employee_id
     ${filter}
       AND e.status = 'approved'
       AND e.period_end >= CURRENT_DATE - INTERVAL '${lookback} months'
     GROUP BY TO_CHAR(e.period_end, 'YYYY-MM')
     ORDER BY period ASC`,
    params
  );
  res.json({ trend: result.rows });
});

// ---------------------------------------------------------------
// Top/bottom performers in a department
// ---------------------------------------------------------------
exports.performers = asyncHandler(async (req, res) => {
  const { departmentId, limit, order } = req.query;
  const lim = Math.min(Math.max(Number(limit) || 5, 1), 20);
  const dir = order === 'asc' ? 'ASC' : 'DESC';

  let filter = 'WHERE e.status = \'approved\'';
  const params = [];
  if (departmentId) {
    params.push(departmentId);
    filter += ` AND e.department_id = $${params.length}`;
  }

  const result = await query(
    `SELECT e.employee_id, u.name, u.employee_code, u.designation, d.name AS department_name,
            e.overall_score, e.period_start, e.period_end,
            ROUND(AVG(es.achievement_pct)::numeric, 2) AS avg_achievement
     FROM evaluations e
     JOIN users u ON u.id = e.employee_id
     JOIN evaluation_scores es ON es.evaluation_id = e.id
     LEFT JOIN departments d ON d.id = e.department_id
     ${filter}
     GROUP BY e.employee_id, u.name, u.employee_code, u.designation, d.name, e.overall_score, e.period_start, e.period_end
     ORDER BY e.overall_score ${dir} NULLS LAST
     LIMIT ${lim}`,
    params
  );
  res.json({ performers: result.rows });
});

// ---------------------------------------------------------------
// Audit trail (admin)
// ---------------------------------------------------------------
exports.auditLogs = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 500);
  const result = await query(
    `SELECT al.id, al.action, al.entity_type, al.entity_id, al.details, al.created_at,
            u.name AS user_name, u.email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT ${lim}`
  );
  res.json({ auditLogs: result.rows });
});
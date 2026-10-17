const { query } = require('../config/db');
const { writeAudit } = require('../utils/audit');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../utils/asyncHandler');
const { computeAchievementAndScore } = require('../utils/scoring');

const EVAL_FIELDS = `
  e.id, e.employee_id, e.evaluator_id, e.department_id, e.period_start, e.period_end,
  e.status, e.overall_score, e.remarks, e.submitted_at, e.approved_at, e.created_at, e.updated_at,
  u.name AS employee_name, u.employee_code, u.designation,
  ev.name AS evaluator_name, d.name AS department_name,
  (SELECT COALESCE(SUM(weight), 0) FROM evaluation_scores es WHERE es.evaluation_id = e.id) AS max_possible
`;

async function recomputeOverall(evaluationId) {
  const sum = await query(
    'SELECT COALESCE(SUM(weighted_score), 0) AS total FROM evaluation_scores WHERE evaluation_id = $1',
    [evaluationId]
  );
  const total = Number(sum.rows[0].total);
  await query('UPDATE evaluations SET overall_score = $1 WHERE id = $2', [total.toFixed(2), evaluationId]);
  return total;
}

exports.list = asyncHandler(async (req, res) => {
  let sql = `
    SELECT ${EVAL_FIELDS}
    FROM evaluations e
    JOIN users u ON u.id = e.employee_id
    LEFT JOIN users ev ON ev.id = e.evaluator_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE 1=1`;
  const params = [];

  if (req.query?.employeeId) {
    params.push(req.query.employeeId);
    sql += ` AND e.employee_id = $${params.length}`;
  } else if (req.user.role === 'employee') {
    params.push(req.user.id);
    sql += ` AND e.employee_id = $${params.length}`;
  } else if (req.user.role === 'hod') {
    params.push(req.user.id);
    sql += ` AND (u.manager_id = $${params.length} OR e.department_id = (SELECT department_id FROM users WHERE id = $${params.length}))`;
  }
  if (req.query?.status) {
    params.push(req.query.status);
    sql += ` AND e.status = $${params.length}`;
  }
  sql += ' ORDER BY e.period_end DESC LIMIT 200';
  const result = await query(sql, params);
  res.json({ evaluations: result.rows });
});

exports.get = asyncHandler(async (req, res) => {
  const evRes = await query(
    `SELECT ${EVAL_FIELDS} FROM evaluations e
     JOIN users u ON u.id = e.employee_id
     LEFT JOIN users ev ON ev.id = e.evaluator_id
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.id = $1`,
    [req.params.id]
  );
  if (evRes.rows.length === 0) throw new AppError('Evaluation not found.', 404);
  const evaluation = evRes.rows[0];

  if (req.user.role === 'employee' && evaluation.employee_id !== req.user.id) {
    throw new AppError('You can only view your own evaluations.', 403);
  }

  const scoresRes = await query(
    `SELECT es.id, es.evaluation_id, es.kpi_id, es.target_value, es.achieved_value,
            es.weight, es.achievement_pct, es.weighted_score, es.comments,
            k.name AS kpi_name, k.unit AS kpi_unit
     FROM evaluation_scores es
     JOIN kpis k ON k.id = es.kpi_id
     WHERE es.evaluation_id = $1
     ORDER BY k.name`,
    [req.params.id]
  );

  res.json({ evaluation, scores: scoresRes.rows });
});

// ---------------------------------------------------------------
// Create or update a draft evaluation with per-KPI scores (HOD/admin)
// ---------------------------------------------------------------

exports.upsert = asyncHandler(async (req, res) => {
  const { evaluationId, employeeId, periodStart, periodEnd, kpis } = req.body;
  // kpis: [{ kpiId, targetValue, achievedValue, weight, comments }]

  if (!Array.isArray(kpis) || kpis.length === 0) {
    throw new AppError('At least one KPI score is required.', 400);
  }

  // Validate target employee belongs to HOD's department
  const empRes = await query('SELECT id, department_id, manager_id FROM users WHERE id = $1', [employeeId]);
  if (empRes.rows.length === 0) throw new AppError('Employee not found.', 404);
  const emp = empRes.rows[0];

  const canEvaluate = req.user.role === 'admin'
    || (emp.department_id === req.user.departmentId)
    || (emp.manager_id === req.user.id);
  if (!canEvaluate) throw new AppError('You can only evaluate employees in your department.', 403);

  const evRes = await query(
    `INSERT INTO evaluations (employee_id, evaluator_id, department_id, period_start, period_end)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (employee_id, period_start, period_end)
     DO UPDATE SET department_id = EXCLUDED.department_id, updated_at = NOW()
     RETURNING id, status, employee_id, period_start, period_end`,
    [employeeId, req.user.id, emp.department_id, periodStart, periodEnd]
  );
  const evaluation = evRes.rows[0];

  if (evaluation.status === 'approved') {
    throw new AppError('An approved evaluation cannot be edited directly.', 400);
  }
  if (evaluation.status === 'submitted') {
    await query('UPDATE evaluations SET status = \'draft\' WHERE id = $1', [evaluation.id]);
  }

  // Insert/refresh scores, computing achievement % and weighted score automatically
  for (const k of kpis) {
    const { achievementPct, weightedScore } = computeAchievementAndScore(k.achievedValue, k.targetValue, k.weight);
    await query(
      `INSERT INTO evaluation_scores (evaluation_id, kpi_id, target_value, achieved_value, weight, achievement_pct, weighted_score, comments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (evaluation_id, kpi_id)
       DO UPDATE SET target_value = EXCLUDED.target_value, achieved_value = EXCLUDED.achieved_value,
                     weight = EXCLUDED.weight, achievement_pct = EXCLUDED.achievement_pct,
                     weighted_score = EXCLUDED.weighted_score, comments = EXCLUDED.comments`,
      [evaluation.id, k.kpiId, k.targetValue, k.achievedValue, k.weight, achievementPct, weightedScore, k.comments]
    );
  }

  const total = await recomputeOverall(evaluation.id);
  await writeAudit(req.user.id, 'EVALUATION_UPSERT', 'evaluation', evaluation.id, { employeeId, total });
  res.json({ evaluation: { ...evaluation, overall_score: Number(total.toFixed(2)) }, message: 'Evaluation draft saved.' });
});

exports.submit = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  const evRes = await query(
    `UPDATE evaluations SET status = 'submitted', remarks = COALESCE($2, remarks), submitted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status IN ('draft', 'submitted')
     RETURNING *`,
    [req.params.id, remarks]
  );
  if (evRes.rows.length === 0) throw new AppError('Evaluation not found or not in editable state.', 404);
  await writeAudit(req.user.id, 'EVALUATION_SUBMIT', 'evaluation', req.params.id);
  res.json({ evaluation: evRes.rows[0], message: 'Evaluation submitted for approval.' });
});

exports.approve = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  const evRes = await query(
    `UPDATE evaluations SET status = 'approved', remarks = COALESCE($2, remarks), approved_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'submitted'
     RETURNING *`,
    [req.params.id, remarks]
  );
  if (evRes.rows.length === 0) throw new AppError('Evaluation not found or not submitted.', 404);
  await writeAudit(req.user.id, 'EVALUATION_APPROVE', 'evaluation', req.params.id);
  res.json({ evaluation: evRes.rows[0], message: 'Evaluation approved.' });
});

exports.reject = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  if (!remarks) throw new AppError('Remarks are required when rejecting an evaluation.', 400);
  const evRes = await query(
    `UPDATE evaluations SET status = 'rejected', remarks = $2, updated_at = NOW()
     WHERE id = $1 AND status = 'submitted'
     RETURNING *`,
    [req.params.id, remarks]
  );
  if (evRes.rows.length === 0) throw new AppError('Evaluation not found or not submitted.', 404);
  await writeAudit(req.user.id, 'EVALUATION_REJECT', 'evaluation', req.params.id);
  res.json({ evaluation: evRes.rows[0], message: 'Evaluation rejected.' });
});
const { query } = require('../config/db');
const { writeAudit } = require('../utils/audit');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT d.*,
           (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.is_active) AS employee_count,
           (SELECT COUNT(*) FROM kpis k WHERE k.department_id = d.id) AS kpi_count
    FROM departments d
    ORDER BY d.name
  `);
  res.json({ departments: result.rows });
});

exports.get = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM departments WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) throw new AppError('Department not found.', 404);
  res.json({ department: result.rows[0] });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;
  const result = await query(
    `INSERT INTO departments (name, code, description) VALUES ($1, $2, $3) RETURNING *`,
    [name, code.toUpperCase(), description]
  );
  await writeAudit(req.user.id, 'DEPARTMENT_CREATE', 'department', result.rows[0].id, { name });
  res.status(201).json({ department: result.rows[0] });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;
  const result = await query(
    `UPDATE departments SET name = $1, code = $2, description = $3, updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [name, code.toUpperCase(), description, req.params.id]
  );
  if (result.rows.length === 0) throw new AppError('Department not found.', 404);
  await writeAudit(req.user.id, 'DEPARTMENT_UPDATE', 'department', req.params.id, { name });
  res.json({ department: result.rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM departments WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rows.length === 0) throw new AppError('Department not found.', 404);
  await writeAudit(req.user.id, 'DEPARTMENT_DELETE', 'department', req.params.id);
  res.json({ message: 'Department deleted.' });
});
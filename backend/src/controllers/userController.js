const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { writeAudit } = require('../utils/audit');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../utils/asyncHandler');

const USER_FIELDS = `u.id, u.employee_code, u.name, u.email, u.role, u.designation,
  u.department_id, u.manager_id, u.is_active, u.joining_date, d.name AS department_name,
  m.name AS manager_name`;

exports.list = asyncHandler(async (req, res) => {
  let sql = `
    SELECT ${USER_FIELDS}
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN users m ON m.id = u.manager_id
    WHERE 1=1`;
  const params = [];

  if (req.user.role === 'hod') {
    // HODs see only their own department's staff (non-admin)
    params.push(req.user.departmentId);
    sql += ` AND u.department_id = $${params.length} AND u.role IN ('employee', 'hod')`;
  }
  if (req.query?.departmentId) {
    params.push(req.query.departmentId);
    sql += ` AND u.department_id = $${params.length}`;
  }
  if (req.query?.role) {
    params.push(req.query.role);
    sql += ` AND u.role = $${params.length}`;
  }
  sql += ' ORDER BY u.name';
  const result = await query(sql, params);
  res.json({ users: result.rows });
});

exports.get = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT ${USER_FIELDS} FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN users m ON m.id = u.manager_id
     WHERE u.id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) throw new AppError('User not found.', 404);

  const user = result.rows[0];
  if (req.user.role === 'hod' && user.department_id !== req.user.departmentId && user.role !== 'employee') {
    throw new AppError('Access denied for users outside your department.', 403);
  }
  res.json({ user });
});

exports.create = asyncHandler(async (req, res) => {
  const { employeeCode, name, email, password, role, designation, departmentId, managerId, joiningDate } = req.body;

  if (String(password).length < 8) {
    throw new AppError('Password must be at least 8 characters long.', 400);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (employee_code, name, email, password_hash, role, designation, department_id, manager_id, joining_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, email, role`,
    [employeeCode, name, email, passwordHash, role, designation, departmentId, managerId, joiningDate]
  );
  await writeAudit(req.user.id, 'USER_CREATE', 'user', result.rows[0].id, { email });
  res.status(201).json({ user: result.rows[0], message: 'User created successfully.' });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, designation, role, departmentId, managerId, isActive, email } = req.body;
  const result = await query(
    `UPDATE users SET name = COALESCE($1, name), designation = COALESCE($2, designation),
      role = COALESCE($3, role), department_id = COALESCE($4, department_id),
      manager_id = COALESCE($5, manager_id), is_active = COALESCE($6, is_active),
      email = COALESCE($7, email), updated_at = NOW()
     WHERE id = $8 RETURNING id, name, email, role`,
    [name, designation, role, departmentId, managerId, isActive, email, req.params.id]
  );
  if (result.rows.length === 0) throw new AppError('User not found.', 404);
  await writeAudit(req.user.id, 'USER_UPDATE', 'user', req.params.id, { email });
  res.json({ user: result.rows[0] });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (String(newPassword).length < 8) {
    throw new AppError('Password must be at least 8 characters long.', 400);
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const result = await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
    [passwordHash, req.params.id]
  );
  if (result.rows.length === 0) throw new AppError('User not found.', 404);
  await writeAudit(req.user.id, 'USER_PASSWORD_RESET', 'user', req.params.id);
  res.json({ message: 'Password reset successfully.' });
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rows.length === 0) throw new AppError('User not found.', 404);
  await writeAudit(req.user.id, 'USER_DELETE', 'user', req.params.id);
  res.json({ message: 'User deleted.' });
});
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { signToken } = require('../utils/jwt');
const { writeAudit } = require('../utils/audit');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../utils/asyncHandler');

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await query(
    `SELECT u.id, u.employee_code, u.name, u.email, u.password_hash, u.role,
            u.designation, u.department_id, u.is_active, d.name AS department_name
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE lower(u.email) = lower($1)`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password.', 401);
  }

  const user = result.rows[0];
  if (!user.is_active) {
    throw new AppError('Your account is deactivated. Contact the administrator.', 403);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken({
    id: user.id,
    role: user.role,
    departmentId: user.department_id,
    name: user.name,
    email: user.email,
  });

  await writeAudit(user.id, 'LOGIN', 'user', user.id, { email: user.email });

  res.json({
    token,
    user: {
      id: user.id,
      employeeCode: user.employee_code,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      departmentId: user.department_id,
      departmentName: user.department_name,
    },
  });
});

exports.me = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT u.id, u.employee_code, u.name, u.email, u.role, u.designation,
            u.department_id, u.is_active, u.joining_date,
            d.name AS department_name,
            (SELECT name FROM users WHERE id = u.manager_id) AS manager_name
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.id = $1`,
    [req.user.id]
  );
  if (result.rows.length === 0) throw new AppError('User not found.', 404);
  res.json({ user: result.rows[0] });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await query('SELECT id, password_hash FROM users WHERE id = $1', [req.user.id]);
  if (result.rows.length === 0) throw new AppError('User not found.', 404);

  const user = result.rows[0];
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new AppError('Current password is incorrect.', 400);

  if (String(newPassword).length < 8) {
    throw new AppError('New password must be at least 8 characters long.', 400);
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);
  await writeAudit(req.user.id, 'PASSWORD_CHANGE', 'user', req.user.id);
  res.json({ message: 'Password updated successfully.' });
});
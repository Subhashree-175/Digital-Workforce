/**
 * Seeds the database with demo departments, users, KPIs, assignments
 * and a sample evaluation so the dashboards have data to display.
 * Usage: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');
const { computeAchievementAndScore } = require('../src/utils/scoring');

const DEFAULT_PASSWORD = 'Password@123';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // ---------------- Departments ----------------
    const deptRes = await client.query(`
      INSERT INTO departments (name, code, description) VALUES
        ('Revenue Department', 'REV', 'Handles land records and tax collection'),
        ('Public Works Department', 'PWD', 'Infrastructure and public works'),
        ('Health Department', 'HLTH', 'Public health services'),
        ('Information Technology Department', 'IT', 'e-Governance and digital services')
      RETURNING id, code;
    `);
    const dept = Object.fromEntries(deptRes.rows.map(r => [r.code, r.id]));

    // ---------------- Users ----------------
    const usersRes = await client.query(`
      INSERT INTO users (employee_code, name, email, password_hash, role, designation, department_id, manager_id, joining_date)
      VALUES
        ('ADM001', 'System Administrator', 'admin@digitalworkforce.gov', $1, 'admin', 'System Administrator', NULL, NULL, '2020-01-01'),
        ('HOD001', 'Anita Sharma', 'anita.sharma@digitalworkforce.gov', $1, 'hod', 'Deputy Commissioner', $2, NULL, '2019-06-15'),
        ('HOD002', 'Rajesh Kumar', 'rajesh.kumar@digitalworkforce.gov', $1, 'hod', 'Executive Engineer', $3, NULL, '2018-03-10'),
        ('EMP001', 'Priya Verma', 'priya.verma@digitalworkforce.gov', $1, 'employee', 'Tehsildar', $2, (SELECT id FROM users WHERE employee_code = 'HOD001'), '2021-07-01'),
        ('EMP002', 'Suresh Nair', 'suresh.nair@digitalworkforce.gov', $1, 'employee', 'Junior Engineer', $3, (SELECT id FROM users WHERE employee_code = 'HOD002'), '2022-01-15'),
        ('EMP003', 'Kavita Rao', 'kavita.rao@digitalworkforce.gov', $1, 'employee', 'Data Entry Operator', $4, (SELECT id FROM users WHERE employee_code = 'HOD001'), '2022-09-01'),
        ('EMP004', 'Mohammed Irfan', 'mohammed.irfan@digitalworkforce.gov', $1, 'employee', 'Revenue Inspector', $2, (SELECT id FROM users WHERE employee_code = 'HOD001'), '2020-11-20'),
        ('EMP005', 'Lakshmi Menon', 'lakshmi.menon@digitalworkforce.gov', $1, 'employee', 'Health Superintendent', $5, NULL, '2017-04-12')
      RETURNING id, employee_code;
    `, [passwordHash, dept.REV, dept.PWD, dept.IT, dept.HLTH]);
    const user = Object.fromEntries(usersRes.rows.map(r => [r.employee_code, r.id]));

    // ---------------- KPIs ----------------
    const kpiRes = await client.query(`
      INSERT INTO kpis (name, description, department_id, unit, default_weight, evaluation_period, created_by)
      VALUES
        ('Case Disposal Rate', 'Number of pending cases resolved', $1, 'count', 40, 'quarterly', $3),
        ('Citizen Grievance Resolution', 'Grievances resolved within SLA', NULL, 'percentage', 30, 'quarterly', $3),
        ('Project Completion Timeliness', 'Projects delivered on schedule', $2, 'percentage', 40, 'quarterly', $3),
        ('Attendance & Punctuality', 'Attendance compliance percentage', NULL, 'percentage', 20, 'monthly', $3),
        ('Digital Records Updated', 'Records digitized/updated', NULL, 'count', 30, 'monthly', $3)
      RETURNING id, name;
    `, [dept.REV, dept.PWD, user.ADM001]);
    const kpi = Object.fromEntries(kpiRes.rows.map(r => [r.name, r.id]));

    await client.query('COMMIT');
    console.log('✅ Base seed (departments, users, kpis) inserted.');

    await seedAssignmentsAndEvaluation(client, dept, user, kpi);
    await seedWorkLogsAndAttendance(client, user, kpi);

    console.log('\nDemo login credentials (password for all: "%s"):', DEFAULT_PASSWORD);
    console.log('  Admin : admin@digitalworkforce.gov');
    console.log('  HOD   : anita.sharma@digitalworkforce.gov / rajesh.kumar@digitalworkforce.gov');
    console.log('  Emp   : priya.verma@digitalworkforce.gov / suresh.nair@digitalworkforce.gov / kavita.rao@digitalworkforce.gov');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

async function seedAssignmentsAndEvaluation(client, dept, user, kpi) {
  await client.query('BEGIN');
  const periodStart = '2024-01-01';
  const periodEnd = '2024-03-31';

  // Assign KPIs to Priya Verma (Revenue)
  const assignments = [
    { emp: user.EMP001, kpiId: kpi['Case Disposal Rate'], target: 100, weight: 40, achieved: 92 },
    { emp: user.EMP001, kpiId: kpi['Citizen Grievance Resolution'], target: 100, weight: 30, achieved: 88 },
    { emp: user.EMP001, kpiId: kpi['Digital Records Updated'], target: 200, weight: 30, achieved: 210 },
  ];

  const evalRes = await client.query(`
    INSERT INTO evaluations (employee_id, evaluator_id, department_id, period_start, period_end, status, remarks)
    VALUES ($1, $2, $3, $4, $5, 'approved', 'Consistent performer, exceeded digitization target.')
    RETURNING id;
  `, [user.EMP001, user.HOD001, dept.REV, periodStart, periodEnd]);
  const evaluationId = evalRes.rows[0].id;

  let overall = 0;
  for (const a of assignments) {
    await client.query(`
      INSERT INTO kpi_assignments (kpi_id, employee_id, target_value, weight, period_start, period_end, assigned_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (kpi_id, employee_id, period_start, period_end) DO NOTHING;
    `, [a.kpiId, a.emp, a.target, a.weight, periodStart, periodEnd, user.HOD001]);

    const { achievementPct, weightedScore } = computeAchievementAndScore(a.achieved, a.target, a.weight);
    overall += weightedScore;

    await client.query(`
      INSERT INTO evaluation_scores (evaluation_id, kpi_id, target_value, achieved_value, weight, achievement_pct, weighted_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [evaluationId, a.kpiId, a.target, a.achieved, a.weight, achievementPct, weightedScore]);
  }

  await client.query(`
    UPDATE evaluations SET overall_score = $1, submitted_at = NOW(), approved_at = NOW() WHERE id = $2;
  `, [overall.toFixed(2), evaluationId]);

  await client.query('COMMIT');
  console.log('✅ Sample KPI assignments & evaluation inserted.');
}

async function seedWorkLogsAndAttendance(client, user, kpi) {
  await client.query('BEGIN');

  // Sample work logs for Priya Verma (EMP001)
  await client.query(`
    INSERT INTO work_logs (employee_id, kpi_id, task_title, task_details, supporting_docs, log_date, status, supervisor_remarks, reviewed_by, submitted_at, reviewed_at) VALUES
      ($1, $2, 'Land record digitization batch', 'Digitized 250 land records and verified property boundaries for the taluk office.',
       '[{"fileName":"digitization_batch_12.xlsx","filePath":"/uploads/seed/digitization_batch_12.xlsx"}]',
       '2024-03-05', 'approved', 'Records verified. Quantity meets target.', $3, '2024-03-05 17:30:00+00', '2024-03-06 09:15:00+00'),
      ($1, $4, 'Grievance resolution drive', 'Resolved 34 citizen grievances filed under the public service guarantee act.',
       '[{"fileName":"grievance_report_q1.xlsx","filePath":"/uploads/seed/grievance_report_q1.xlsx"}]',
       '2024-03-18', 'approved', 'All grievances closed within SLA.', $3, '2024-03-18 16:45:00+00', '2024-03-19 10:05:00+00'),
      ($1, $5, 'Field inspection - revenue survey', 'Conducted field inspection at village cluster for revenue survey updates.',
       '[]', '2024-03-25', 'pending', NULL, NULL, '2024-03-25 15:20:00+00', NULL);
  `, [user.EMP001, kpi['Case Disposal Rate'], user.HOD001, kpi['Citizen Grievance Resolution'], kpi['Digital Records Updated']]);

  // Rejected example for Suresh Nair (EMP002)
  await client.query(`
    INSERT INTO work_logs (employee_id, kpi_id, task_title, task_details, supporting_docs, log_date, status, supervisor_remarks, reviewed_by, submitted_at, reviewed_at) VALUES
      ($1, $2, 'Drainage project progress update', 'Posted progress of drain relining works at sector 4.',
       '[]', '2024-03-20', 'rejected', 'Supporting photographs/measurements missing. Resubmit with evidence.', $3, '2024-03-20 12:10:00+00', '2024-03-21 09:30:00+00');
  `, [user.EMP002, kpi['Project Completion Timeliness'], user.HOD002]);

  // A few attendance rows for the last 8 working days
  const workDays = [];
  const d = new Date('2024-03-31T00:00:00Z');
  for (let i = 0; i < 20 && workDays.length < 8; i++) {
    d.setUTCDate(d.getUTCDate() - 1);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    workDays.push(d.toISOString().slice(0, 10));
  }
  for (const date of workDays) {
    await client.query(`
      INSERT INTO attendance_records (employee_id, attendance_date, check_in, check_out, total_hours, status)
      VALUES ($1, $2, '09:15', '17:45', 8.5, 'present')
      ON CONFLICT (employee_id, attendance_date) DO NOTHING;
    `, [user.EMP001, date]);
  }

  await client.query('COMMIT');
  console.log('✅ Sample work logs & attendance inserted.');
}

seed();

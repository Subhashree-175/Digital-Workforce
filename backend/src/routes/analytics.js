const express = require('express');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.get('/summary', analyticsController.summary);
router.get('/department-productivity', analyticsController.departmentProductivity);
router.get('/kpi-trend', analyticsController.kpiAchievementTrend);
router.get('/performers', analyticsController.performers);
router.get('/audit-logs', analyticsController.auditLogs);

module.exports = router;
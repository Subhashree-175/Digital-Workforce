const express = require('express');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get('/:type', reportController.exportReport);

module.exports = router;
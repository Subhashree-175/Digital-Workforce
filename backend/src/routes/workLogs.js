const express = require('express');
const workLogController = require('../controllers/workLogController');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/', workLogController.list);
router.get('/pending', workLogController.reporteesWorkLogs);
router.get('/:id', workLogController.get);
router.post('/', upload.array('documents', 5), workLogController.create);
router.put('/:id/review', workLogController.review);

module.exports = router;
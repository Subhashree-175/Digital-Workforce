const express = require('express');
const evaluationController = require('../controllers/evaluationController');

const router = express.Router();

router.get('/', evaluationController.list);
router.post('/upsert', evaluationController.upsert);
router.get('/:id', evaluationController.get);
router.put('/:id/submit', evaluationController.submit);
router.put('/:id/approve', evaluationController.approve);
router.put('/:id/reject', evaluationController.reject);

module.exports = router;
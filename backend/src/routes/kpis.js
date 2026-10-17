const express = require('express');
const kpiController = require('../controllers/kpiController');

const router = express.Router();

router.get('/', kpiController.list);
router.get('/assignments', kpiController.listAssignments);
router.post('/assignments', kpiController.assign);
router.post('/preview-score', kpiController.previewScore);
router.get('/:id', kpiController.get);
router.post('/', kpiController.create);
router.put('/:id', kpiController.update);
router.delete('/:id', kpiController.remove);
router.delete('/assignments/:id', kpiController.removeAssignment);

module.exports = router;
const express = require('express');
const departmentController = require('../controllers/departmentController');

const router = express.Router();

router.get('/', departmentController.list);
router.get('/:id', departmentController.get);
router.post('/', departmentController.create);
router.put('/:id', departmentController.update);
router.delete('/:id', departmentController.remove);

module.exports = router;
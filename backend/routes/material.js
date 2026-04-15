const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/auth');
const { createSingleUpload } = require('../config/multer');

router.use(protect);
router.get('/template', ctrl.downloadTemplate);
router.get('/', ctrl.getMaterials);
router.post('/', authorize('SUPER_ADMIN', 'PURCHASE_ADMIN'), ctrl.createMaterial);
router.post('/bulk-upload',
  authorize('SUPER_ADMIN', 'PURCHASE_ADMIN'),
  createSingleUpload('bulk', 'file'),
  ctrl.bulkUpload
);
router.put('/:id', authorize('SUPER_ADMIN', 'PURCHASE_ADMIN'), ctrl.updateMaterial);
router.delete('/:id', authorize('SUPER_ADMIN'), ctrl.deleteMaterial);
module.exports = router;

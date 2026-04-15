const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/enquiryController');
const { protect, authorize } = require('../middleware/auth');
const { createUpload } = require('../config/multer');

router.use(protect);
router.get('/stats', ctrl.getDashboardStats);
router.get('/', ctrl.getEnquiries);
router.post('/', authorize('SUPER_ADMIN', 'SALES_ADMIN'), createUpload('enquiries'), ctrl.createEnquiry);
router.get('/:id', ctrl.getEnquiry);
router.put('/:id', authorize('SUPER_ADMIN', 'SALES_ADMIN'), ctrl.updateEnquiry);
router.delete('/:id', authorize('SUPER_ADMIN'), ctrl.deleteEnquiry);
module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productionController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const { createUpload } = require('../config/multer');

router.use(protect);
router.get('/stats', ctrl.getDashboardStats);
router.get('/', ctrl.getJobs);
router.post('/',
  authorize('SUPER_ADMIN', 'PURCHASE_ADMIN'),
  (req, res, next) => {
    const upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const fs = require('fs');
          const path = require('path');
          const folder = file.fieldname === 'bomFiles' ? 'production/bom' : 'production/drawings';
          const dir = path.join(__dirname, '..', 'uploads', folder);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
      })
    }).fields([{ name: 'bomFiles', maxCount: 5 }, { name: 'drawingFiles', maxCount: 10 }]);
    upload(req, res, next);
  },
  ctrl.createJob
);
router.get('/:id', ctrl.getJob);
router.put('/:id/fabrication-status', authorize('SUPER_ADMIN', 'FABRICATION_ADMIN'), ctrl.updateFabricationStatus);
router.put('/:id/powder-coating-status', authorize('SUPER_ADMIN', 'ELECTRICAL_ADMIN'), ctrl.updatePowderCoatingStatus);
router.put('/:id/mounting-plate-powder-coating-status', authorize('SUPER_ADMIN', 'ELECTRICAL_ADMIN'), ctrl.updateMountingPlatePowderCoatingStatus);
router.put('/:id/electrical-status', authorize('SUPER_ADMIN', 'ELECTRICAL_ADMIN'), ctrl.updateElectricalStatus);
router.post('/:id/work-logs', authorize('SUPER_ADMIN', 'FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'), ctrl.addWorkLog);
router.put('/:id/assign', authorize('SUPER_ADMIN'), ctrl.assignJob);
router.delete('/:id', authorize('SUPER_ADMIN'), ctrl.deleteJob);
module.exports = router;

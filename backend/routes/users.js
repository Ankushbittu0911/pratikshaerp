const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, getRoles } = require('../controllers/usersController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/roles', getRoles);
router.get('/', authorize('SUPER_ADMIN'), getUsers);
router.post('/', authorize('SUPER_ADMIN'), createUser);
router.put('/:id', authorize('SUPER_ADMIN'), updateUser);
module.exports = router;

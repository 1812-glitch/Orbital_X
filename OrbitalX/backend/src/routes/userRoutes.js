const express = require('express');
const { getAllUsers, updateUserRole, toggleUserStatus } = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.route('/').get(getAllUsers);
router.route('/:id/role').put(updateUserRole);
router.route('/:id/status').put(toggleUserStatus);

module.exports = router;

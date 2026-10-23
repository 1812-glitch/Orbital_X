const express = require('express');
const {
  getMissions,
  getMissionById,
  createMission,
  updateMission,
  deleteMission
} = require('../controllers/missionController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.route('/')
  .get(getMissions)
  .post(requireRole('ADMIN', 'OPERATOR'), createMission);

router.route('/:id')
  .get(getMissionById)
  .put(requireRole('ADMIN', 'OPERATOR'), updateMission)
  .delete(requireRole('ADMIN', 'OPERATOR'), deleteMission);

module.exports = router;

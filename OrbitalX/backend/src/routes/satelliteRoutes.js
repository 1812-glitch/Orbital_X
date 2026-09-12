const express = require('express');
const {
  getSatellites,
  getSatelliteById,
  createSatellite,
  updateSatellite,
  deleteSatellite
} = require('../controllers/satelliteController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth); // Protect all routes

router.route('/')
  .get(getSatellites)
  .post(requireRole('ADMIN', 'OPERATOR'), createSatellite);

router.route('/:id')
  .get(getSatelliteById)
  .put(requireRole('ADMIN', 'OPERATOR'), updateSatellite)
  .delete(requireRole('ADMIN'), deleteSatellite);

module.exports = router;

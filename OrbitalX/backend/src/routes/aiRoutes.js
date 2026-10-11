const express = require('express');
const { diagnoseAnomaly } = require('../controllers/aiController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/diagnose', diagnoseAnomaly);

module.exports = router;

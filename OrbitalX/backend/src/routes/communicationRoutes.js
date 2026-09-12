const express = require('express');
const { getMissionCommunications, postCommunication } = require('../controllers/communicationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.route('/').post(requireAuth, postCommunication);
router.route('/mission/:missionId').get(requireAuth, getMissionCommunications);

module.exports = router;

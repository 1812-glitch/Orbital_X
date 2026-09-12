const express = require('express');
const { register, login, getProfile, updatePassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
// In a stateless JWT setup, logout is typically handled client-side by deleting the token.
// Providing a dummy endpoint if required by design:
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', requireAuth, getProfile);
router.put('/password', requireAuth, updatePassword);

module.exports = router;

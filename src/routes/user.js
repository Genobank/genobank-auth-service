const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authenticate');

// Get current user
router.get('/me', authenticate, userController.getCurrentUser);

// Update user profile
router.put('/me', authenticate, userController.updateProfile);

// Link additional auth method
router.post('/link', authenticate, userController.linkAuthMethod);

// Get user sessions
router.get('/sessions', authenticate, userController.getSessions);

module.exports = router;
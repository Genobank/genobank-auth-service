const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login endpoint
router.post('/login', authController.login);

// Logout endpoint
router.post('/logout', authController.logout);

// Refresh token endpoint
router.post('/refresh', authController.refresh);

// Verify signature endpoint
router.post('/verify', authController.verify);

// Email verification endpoint
router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router;
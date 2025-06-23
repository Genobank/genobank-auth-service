const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticate } = require('../middleware/authenticate');
const tokenService = require('../services/tokenService');
const userService = require('../services/userService');

// Get current session (public endpoint - returns auth status)
router.get('/', async (req, res) => {
  try {
    // Get token from header or cookie
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.auth_token;
    
    if (!token) {
      return res.json({
        authenticated: false
      });
    }

    // Verify token
    const verification = await tokenService.verifyAccessToken(token);
    
    if (!verification.valid) {
      return res.json({
        authenticated: false
      });
    }

    // Get user
    const user = await userService.findById(verification.decoded.userId);
    
    if (!user) {
      return res.json({
        authenticated: false
      });
    }

    // Return authenticated status with user info
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        address: user.address,
        email: user.email,
        name: user.name,
        picture: user.picture,
        auth_methods: user.auth_methods,
        is_permittee: user.is_permittee
      },
      expires_at: new Date(verification.decoded.exp * 1000).toISOString(),
      issued_at: new Date(verification.decoded.iat * 1000).toISOString()
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.json({
      authenticated: false
    });
  }
});

// Validate session (requires authentication)
router.post('/validate', sessionController.validateSession);

module.exports = router;
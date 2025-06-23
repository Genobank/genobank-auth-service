const tokenService = require('../services/tokenService');
const userService = require('../services/userService');

async function authenticate(req, res, next) {
  try {
    // Get token from header or cookie
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify token
    const verification = await tokenService.verifyAccessToken(token);
    
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: verification.error || 'Invalid token'
      });
    }

    // Get user
    const user = await userService.findById(verification.decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = verification.decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

module.exports = { authenticate };
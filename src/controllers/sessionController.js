const tokenService = require('../services/tokenService');
const userService = require('../services/userService');

class SessionController {
  async getSession(req, res) {
    try {
      // User is already attached by authenticate middleware
      const user = req.user;
      const token = req.token;
      
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
        expires_at: new Date(token.exp * 1000).toISOString(),
        issued_at: new Date(token.iat * 1000).toISOString()
      });
    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async validateSession(req, res) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token required'
        });
      }

      const verification = await tokenService.verifyAccessToken(token);
      
      if (!verification.valid) {
        return res.json({
          valid: false,
          error: verification.error
        });
      }

      // Get user data
      const user = await userService.findById(verification.decoded.userId);
      
      res.json({
        valid: true,
        user: user ? {
          id: user.id,
          address: user.address,
          email: user.email,
          name: user.name,
          auth_methods: user.auth_methods,
          is_permittee: user.is_permittee
        } : null,
        expires_at: new Date(verification.decoded.exp * 1000).toISOString()
      });
    } catch (error) {
      console.error('Validate session error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new SessionController();
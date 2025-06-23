const userService = require('../services/userService');
const authService = require('../services/authService');
const { validateUpdateProfile, validateLinkAuthMethod } = require('../utils/validators');

class UserController {
  async getCurrentUser(req, res) {
    try {
      const user = req.user;
      
      res.json({
        success: true,
        user: {
          id: user.id,
          address: user.address,
          email: user.email,
          name: user.name,
          picture: user.picture,
          auth_methods: user.auth_methods,
          is_permittee: user.is_permittee,
          created_at: user.created_at,
          last_login: user.last_login
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { error, value } = validateUpdateProfile(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const updatedUser = await userService.updateUser(req.user.id, value);
      
      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          address: updatedUser.address,
          email: updatedUser.email,
          name: updatedUser.name,
          picture: updatedUser.picture,
          auth_methods: updatedUser.auth_methods,
          is_permittee: updatedUser.is_permittee
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async linkAuthMethod(req, res) {
    try {
      const { error, value } = validateLinkAuthMethod(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await authService.linkAuthMethod(
        req.user.id,
        value.method,
        value
      );
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        user: {
          id: result.user.id,
          address: result.user.address,
          email: result.user.email,
          name: result.user.name,
          picture: result.user.picture,
          auth_methods: result.user.auth_methods,
          is_permittee: result.user.is_permittee
        }
      });
    } catch (error) {
      console.error('Link auth method error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getSessions(req, res) {
    try {
      const sessions = await userService.getUserSessions(req.user.id);
      
      res.json({
        success: true,
        sessions: sessions.map(session => ({
          id: session.id,
          created_at: session.created_at,
          last_accessed: session.last_accessed,
          ip_address: session.ip_address,
          user_agent: session.user_agent,
          is_current: session.token_id === req.token.tokenId
        }))
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new UserController();
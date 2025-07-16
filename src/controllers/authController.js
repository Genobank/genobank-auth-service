const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const authService = require('../services/authService');
const tokenService = require('../services/tokenService');
const { validateLoginRequest } = require('../utils/validators');

const MESSAGE_TO_SIGN = "I want to proceed";
const COOKIE_DOMAIN = '.genobank.app';

class AuthController {
  async login(req, res) {
    try {
      // Validate request
      const { error, value } = validateLoginRequest(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { method, signature, address, email, token, client_id, redirect_uri, state } = value;

      let authResult;
      
      switch (method) {
        case 'metamask':
        case 'biowallet':
        case 'wallet': // Legacy support for old auth.js
          authResult = await authService.authenticateWallet(address, signature);
          break;
          
        case 'email':
          authResult = await authService.authenticateEmail(email);
          // Don't generate tokens yet for email - wait for verification
          if (authResult.success) {
            return res.json({
              success: true,
              message: authResult.message
            });
          }
          break;
          
        case 'google':
          authResult = await authService.authenticateGoogle(address, signature, email, token);
          break;
          
        case 'walletconnect':
          authResult = await authService.authenticateWalletConnect(address, signature);
          break;
          
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid authentication method'
          });
      }

      if (!authResult.success) {
        return res.status(401).json({
          success: false,
          error: authResult.error
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = await tokenService.generateTokens({
        userId: authResult.user.id,
        address: authResult.user.address,
        email: authResult.user.email,
        method: method
      });

      // Set cookies
      res.cookie('auth_token', accessToken, {
        domain: COOKIE_DOMAIN,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      res.cookie('refresh_token', refreshToken, {
        domain: COOKIE_DOMAIN,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Additional cookies for backward compatibility
      res.cookie('user_signature', signature || '', {
        domain: COOKIE_DOMAIN,
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.cookie('user_wallet', authResult.user.address, {
        domain: COOKIE_DOMAIN,
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.cookie('login_method', method, {
        domain: COOKIE_DOMAIN,
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      // Return response
      res.json({
        success: true,
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: authResult.user.id,
          address: authResult.user.address,
          email: authResult.user.email,
          name: authResult.user.name,
          auth_methods: authResult.user.auth_methods,
          is_permittee: authResult.user.is_permittee
        },
        expires_in: 3600
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.auth_token;
      
      if (token) {
        // Invalidate token
        await tokenService.revokeToken(token);
      }

      // Clear all cookies
      const cookiesToClear = [
        'auth_token', 'refresh_token', 'user_signature', 'user_wallet', 
        'magic_token', 'login_method', 'isPermittee', 'email', 'name', 'picture'
      ];

      cookiesToClear.forEach(cookieName => {
        res.cookie(cookieName, '', {
          domain: COOKIE_DOMAIN,
          httpOnly: cookieName.includes('token'),
          secure: true,
          sameSite: 'lax',
          maxAge: 0,
          expires: new Date(0)
        });
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async refresh(req, res) {
    try {
      const refreshToken = req.body.refresh_token || req.cookies.refresh_token;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token required'
        });
      }

      const result = await tokenService.refreshTokens(refreshToken);
      
      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error
        });
      }

      // Set new cookies
      res.cookie('auth_token', result.accessToken, {
        domain: COOKIE_DOMAIN,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      res.cookie('refresh_token', result.refreshToken, {
        domain: COOKIE_DOMAIN,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.json({
        success: true,
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        expires_in: 3600
      });

    } catch (error) {
      console.error('Refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async verify(req, res) {
    try {
      const { signature, address, message } = req.body;
      
      if (!signature || !address) {
        return res.status(400).json({
          success: false,
          error: 'Signature and address required'
        });
      }

      const recoveredAddress = ethers.verifyMessage(message || MESSAGE_TO_SIGN, signature);
      const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();

      res.json({
        success: true,
        valid: isValid,
        recovered_address: recoveredAddress
      });

    } catch (error) {
      console.error('Verify error:', error);
      res.status(500).json({
        success: false,
        error: 'Invalid signature'
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token required'
        });
      }

      const result = await authService.verifyEmailToken(token);
      
      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = await tokenService.generateTokens({
        userId: result.user.id,
        address: result.user.address,
        email: result.user.email,
        method: 'email'
      });

      // Set cookies
      res.cookie('auth_token', accessToken, {
        domain: COOKIE_DOMAIN,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      res.cookie('refresh_token', refreshToken, {
        domain: COOKIE_DOMAIN,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect to return URL or success page
      const returnUrl = req.query.returnUrl || 'https://genobank.app/dashboard';
      res.redirect(returnUrl);
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();
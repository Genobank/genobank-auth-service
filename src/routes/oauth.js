const express = require('express');
const router = express.Router();
// const { OAuth2Client } = require('google-auth-library'); // Not installed yet
const tokenService = require('../services/tokenService');
const userService = require('../services/userService');
const authService = require('../services/authService');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://auth.genobank.app';

// Google OAuth initiation
router.get('/google', (req, res) => {
  try {
    const state = req.query.state || '';
    
    // For now, since we don't have Google OAuth configured,
    // we'll redirect to a popup-based flow
    const redirectUrl = `${AUTH_SERVICE_URL}/oauth-google.html?state=${encodeURIComponent(state)}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth initialization failed'
    });
  }
});

// OAuth callback handler
router.post('/callback', async (req, res) => {
  try {
    const { code, state, provider } = req.body;
    
    if (!provider) {
      return res.status(400).json({
        success: false,
        error: 'Provider required'
      });
    }
    
    // Handle different providers
    let authResult;
    switch (provider) {
      case 'google':
        // In production, validate Google OAuth code
        // For now, we'll return an error since Google OAuth isn't configured
        return res.status(400).json({
          success: false,
          error: 'Google OAuth not configured. Please use email or wallet authentication.'
        });
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid provider'
        });
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth callback failed'
    });
  }
});

module.exports = router;
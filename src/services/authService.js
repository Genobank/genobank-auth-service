const { ethers } = require('ethers');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const userService = require('./userService');
const genobankApi = require('../utils/genobankApi');

const MESSAGE_TO_SIGN = "I want to proceed";
const MAGIC_API_KEY = process.env.MAGIC_API_KEY || "pk_live_5F9630468805C3A0";

class AuthService {
  constructor() {
    // Magic SDK will be handled client-side
    this.magicApiKey = MAGIC_API_KEY;
    this.emailTokens = new Map(); // Temporary storage for email verification tokens
  }

  async authenticateWallet(address, signature) {
    try {
      // Verify signature
      const recoveredAddress = ethers.verifyMessage(MESSAGE_TO_SIGN, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return {
          success: false,
          error: 'Invalid signature'
        };
      }

      // Check if user exists or create new
      let user = await userService.findByAddress(address);
      
      if (!user) {
        // Get user details from GenoBank API
        const genobankUser = await genobankApi.getUserDetails(address);
        const isPermittee = await genobankApi.validatePermittee(address);
        
        user = await userService.createUser({
          id: uuidv4(),
          address: address.toLowerCase(),
          is_permittee: isPermittee,
          auth_methods: ['metamask'],
          created_at: new Date(),
          last_login: new Date()
        });
      } else {
        // Update last login
        await userService.updateLastLogin(user.id);
      }

      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('Wallet authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  async authenticateEmail(email) {
    try {
      // Generate a secure token for email verification
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      // Store token temporarily
      this.emailTokens.set(token, {
        email: email.toLowerCase(),
        expires
      });
      
      // Clean up expired tokens
      for (const [key, value] of this.emailTokens.entries()) {
        if (value.expires < new Date()) {
          this.emailTokens.delete(key);
        }
      }
      
      // In production, send email with magic link
      // For now, we'll log the token (remove in production!)
      console.log(`Email authentication token for ${email}: ${token}`);
      
      // TODO: Implement email sending service
      // await emailService.sendMagicLink(email, token);
      
      return {
        success: true,
        message: 'Magic link sent to your email'
      };
    } catch (error) {
      console.error('Email authentication error:', error);
      return {
        success: false,
        error: 'Failed to send magic link'
      };
    }
  }

  async verifyEmailToken(token) {
    try {
      const tokenData = this.emailTokens.get(token);
      
      if (!tokenData) {
        return {
          success: false,
          error: 'Invalid or expired token'
        };
      }
      
      if (tokenData.expires < new Date()) {
        this.emailTokens.delete(token);
        return {
          success: false,
          error: 'Token expired'
        };
      }
      
      // Remove token after use
      this.emailTokens.delete(token);
      
      // Find or create user
      let user = await userService.findByEmail(tokenData.email);
      
      if (!user) {
        user = await userService.createUser({
          id: uuidv4(),
          email: tokenData.email,
          auth_methods: ['email'],
          created_at: new Date(),
          last_login: new Date()
        });
      } else {
        await userService.updateLastLogin(user.id);
      }
      
      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Email token verification error:', error);
      return {
        success: false,
        error: 'Verification failed'
      };
    }
  }

  async authenticateGoogle(address, signature, email, token) {
    try {
      // Verify signature (Magic SDK signs the message)
      const recoveredAddress = ethers.verifyMessage(MESSAGE_TO_SIGN, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return {
          success: false,
          error: 'Invalid signature'
        };
      }

      // Find or create user by email or address
      let user = await userService.findByEmail(email);
      
      if (!user) {
        user = await userService.findByAddress(address);
      }
      
      if (!user) {
        // Get user details from GenoBank API
        const genobankUser = await genobankApi.getUserDetails(address);
        const isPermittee = await genobankApi.validatePermittee(address);
        
        user = await userService.createUser({
          id: uuidv4(),
          address: address.toLowerCase(),
          email: email.toLowerCase(),
          is_permittee: isPermittee,
          auth_methods: ['google'],
          created_at: new Date(),
          last_login: new Date()
        });
      } else {
        // Add google to auth methods if not present
        if (!user.auth_methods.includes('google')) {
          user.auth_methods.push('google');
          await userService.updateUser(user.id, { auth_methods: user.auth_methods });
        }
        // Update email if not set
        if (!user.email && email) {
          await userService.updateUser(user.id, { email: email.toLowerCase() });
        }
        await userService.updateLastLogin(user.id);
      }

      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('Google authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  async authenticateWalletConnect(address, signature) {
    // WalletConnect authentication is similar to regular wallet
    return this.authenticateWallet(address, signature);
  }

  async linkAuthMethod(userId, method, methodData) {
    try {
      const user = await userService.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Add new auth method
      if (!user.auth_methods.includes(method)) {
        user.auth_methods.push(method);
      }

      // Update user data based on method
      const updates = { auth_methods: user.auth_methods };
      
      if (method === 'metamask' && methodData.address) {
        updates.address = methodData.address.toLowerCase();
      } else if (method === 'google' && methodData.email) {
        updates.email = methodData.email.toLowerCase();
        if (methodData.name) updates.name = methodData.name;
        if (methodData.picture) updates.picture = methodData.picture;
      }

      await userService.updateUser(userId, updates);

      return {
        success: true,
        user: await userService.findById(userId)
      };

    } catch (error) {
      console.error('Link auth method error:', error);
      return {
        success: false,
        error: 'Failed to link authentication method'
      };
    }
  }
}

module.exports = new AuthService();
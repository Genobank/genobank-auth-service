const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '30d';

class TokenService {
  async generateTokens(payload) {
    const tokenId = uuidv4();
    
    const accessToken = jwt.sign(
      {
        ...payload,
        tokenId,
        type: 'access'
      },
      ACCESS_TOKEN_SECRET,
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        issuer: 'auth.genobank.app',
        audience: 'genobank.app'
      }
    );

    const refreshToken = jwt.sign(
      {
        userId: payload.userId,
        tokenId,
        type: 'refresh'
      },
      REFRESH_TOKEN_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        issuer: 'auth.genobank.app',
        audience: 'genobank.app'
      }
    );

    // Store refresh token in Redis
    await redisClient.setex(
      `refresh_token:${tokenId}`,
      30 * 24 * 60 * 60, // 30 days in seconds
      JSON.stringify({
        userId: payload.userId,
        createdAt: new Date().toISOString()
      })
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET, {
        issuer: 'auth.genobank.app',
        audience: 'genobank.app'
      });

      // Check if token is revoked
      const isRevoked = await redisClient.get(`revoked_token:${decoded.tokenId}`);
      if (isRevoked) {
        return { valid: false, error: 'Token revoked' };
      }

      return { valid: true, decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
        issuer: 'auth.genobank.app',
        audience: 'genobank.app'
      });

      // Check if token exists in Redis
      const tokenData = await redisClient.get(`refresh_token:${decoded.tokenId}`);
      if (!tokenData) {
        return { valid: false, error: 'Token not found' };
      }

      return { valid: true, decoded, tokenData: JSON.parse(tokenData) };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async refreshTokens(refreshToken) {
    const verification = await this.verifyRefreshToken(refreshToken);
    
    if (!verification.valid) {
      return {
        success: false,
        error: verification.error
      };
    }

    // Revoke old refresh token
    await redisClient.del(`refresh_token:${verification.decoded.tokenId}`);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens({
      userId: verification.decoded.userId
    });

    return {
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  async revokeToken(token) {
    try {
      // Try to decode as access token first
      let decoded;
      try {
        decoded = jwt.verify(token, ACCESS_TOKEN_SECRET, { ignoreExpiration: true });
      } catch {
        // Try as refresh token
        decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, { ignoreExpiration: true });
      }

      if (decoded && decoded.tokenId) {
        // Revoke the token
        await redisClient.setex(
          `revoked_token:${decoded.tokenId}`,
          30 * 24 * 60 * 60, // Keep for 30 days
          '1'
        );

        // Delete refresh token if exists
        await redisClient.del(`refresh_token:${decoded.tokenId}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Revoke token error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TokenService();
const redisClient = require('../utils/redis');

class UserService {
  async findById(userId) {
    const userData = await redisClient.get(`user:${userId}`);
    return userData ? JSON.parse(userData) : null;
  }

  async findByAddress(address) {
    const userId = await redisClient.get(`address:${address.toLowerCase()}`);
    return userId ? await this.findById(userId) : null;
  }

  async findByEmail(email) {
    const userId = await redisClient.get(`email:${email.toLowerCase()}`);
    return userId ? await this.findById(userId) : null;
  }

  async createUser(userData) {
    const user = {
      id: userData.id,
      address: userData.address?.toLowerCase(),
      email: userData.email?.toLowerCase(),
      name: userData.name,
      picture: userData.picture,
      auth_methods: userData.auth_methods || [],
      is_permittee: userData.is_permittee || false,
      created_at: userData.created_at || new Date(),
      last_login: userData.last_login || new Date(),
      metadata: userData.metadata || {}
    };

    // Store user data
    await redisClient.set(`user:${user.id}`, JSON.stringify(user));

    // Create indexes
    if (user.address) {
      await redisClient.set(`address:${user.address}`, user.id);
    }
    if (user.email) {
      await redisClient.set(`email:${user.email}`, user.id);
    }

    return user;
  }

  async updateUser(userId, updates) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Handle address change
    if (updates.address && updates.address !== user.address) {
      // Remove old index
      if (user.address) {
        await redisClient.del(`address:${user.address}`);
      }
      // Create new index
      await redisClient.set(`address:${updates.address.toLowerCase()}`, userId);
      updates.address = updates.address.toLowerCase();
    }

    // Handle email change
    if (updates.email && updates.email !== user.email) {
      // Remove old index
      if (user.email) {
        await redisClient.del(`email:${user.email}`);
      }
      // Create new index
      await redisClient.set(`email:${updates.email.toLowerCase()}`, userId);
      updates.email = updates.email.toLowerCase();
    }

    // Update user object
    const updatedUser = { ...user, ...updates };
    await redisClient.set(`user:${userId}`, JSON.stringify(updatedUser));

    return updatedUser;
  }

  async updateLastLogin(userId) {
    return this.updateUser(userId, { last_login: new Date() });
  }

  async deleteUser(userId) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove indexes
    if (user.address) {
      await redisClient.del(`address:${user.address}`);
    }
    if (user.email) {
      await redisClient.del(`email:${user.email}`);
    }

    // Remove user data
    await redisClient.del(`user:${userId}`);

    return { success: true };
  }

  async getUserSessions(userId) {
    // Get all active sessions for a user
    const pattern = `session:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    const sessions = [];

    for (const key of keys) {
      const sessionData = await redisClient.get(key);
      if (sessionData) {
        sessions.push(JSON.parse(sessionData));
      }
    }

    return sessions;
  }
}

module.exports = new UserService();
const redis = require('redis');

// Create Redis client
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Connect to Redis
client.connect().catch(console.error);

// Handle errors
client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

// Promisify Redis methods for easier use
const redisClient = {
  async get(key) {
    return client.get(key);
  },

  async set(key, value, options) {
    if (options?.EX) {
      return client.setEx(key, options.EX, value);
    }
    return client.set(key, value);
  },

  async setex(key, seconds, value) {
    return client.setEx(key, seconds, value);
  },

  async del(key) {
    return client.del(key);
  },

  async exists(key) {
    return client.exists(key);
  },

  async keys(pattern) {
    return client.keys(pattern);
  },

  async expire(key, seconds) {
    return client.expire(key, seconds);
  },

  async ttl(key) {
    return client.ttl(key);
  },

  async hget(key, field) {
    return client.hGet(key, field);
  },

  async hset(key, field, value) {
    return client.hSet(key, field, value);
  },

  async hgetall(key) {
    return client.hGetAll(key);
  },

  async hdel(key, field) {
    return client.hDel(key, field);
  }
};

module.exports = redisClient;
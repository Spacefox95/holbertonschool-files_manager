import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this._client = createClient();
    this._client.on('error', () => console.error(false));
  }

  isAlive() {
    if (this._client) return true;
    return false;
  }

  async get(key) {
    try {
      const value = await this._client.get(key);
      if (value) return value;
      return null;
    } catch (err) {
      console.error(`Error getting key "${key}":`, err);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      this._client.set(key, String(value), 'EX', duration);
      console.log(value);
    } catch (err) {
      console.error(err);
    }
  }

  async del(key) {
    this._client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;

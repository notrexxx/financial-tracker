import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  /**
   * Retrieves a parsed JSON object from the cache.
   */
  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      return null;
    }
  }

  /**
   * Saves a JSON object to the cache with an expiration time in seconds (TTL).
   * Default TTL is 300 seconds (5 minutes).
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const data = JSON.stringify(value);
    await this.redisClient.set(key, data, 'EX', ttlSeconds);
  }

  /**
   * Deletes a specific key from the cache.
   * Useful for instantly invalidating data when a user creates a new transaction.
   */
  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
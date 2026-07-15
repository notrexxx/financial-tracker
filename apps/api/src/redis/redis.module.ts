import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (!redisUrl) {
          throw new Error('CRITICAL ARCHITECTURAL ERROR: REDIS_URL configuration parameter is missing.');
        }
        
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3, 
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        client.on('error', (err) => {
          console.error('Redis Client Error:', err);
        });

        client.on('connect', () => {
          console.log('Successfully connected to Redis Cache Layer.');
        });

        return client;
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
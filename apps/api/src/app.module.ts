import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryModule } from '@sentry/nestjs/setup'; // <-- NEW: V9 Sentry Module

import { User } from './database/entities/user.entity';
import { Category } from './database/entities/category.entity';
import { Transaction } from './database/entities/transaction.entity';
import { ExchangeRate } from './database/entities/exchange-rate.entity';
import { AnalyticsModule } from './analytics/analytics.module';
import { TasksModule } from './tasks/tasks.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // NEW: Inject the flight recorder globally
    SentryModule.forRoot(), 
    
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error('CRITICAL ARCHITECTURAL ERROR: DATABASE_URL configuration parameter is missing.');
        }
        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [User, Category, Transaction, ExchangeRate],
          synchronize: false, 
          ssl: {
            rejectUnauthorized: false,
          },
        };
      },
    }),
    RedisModule, 
    AnalyticsModule,
    TasksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
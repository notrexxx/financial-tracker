import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from './database/entities/user.entity';
import { Category } from './database/entities/category.entity';
import { Transaction } from './database/entities/transaction.entity';
import { ExchangeRate } from './database/entities/exchange-rate.entity';
import { AnalyticsModule } from './analytics/analytics.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
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
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          ssl: {
            rejectUnauthorized: false,
          },
        };
      },
    }),
    AnalyticsModule,
    TasksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './entities/user.entity';
import { Category } from './entities/category.entity';
import { Transaction } from './entities/transaction.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';

dotenv.config({ path: '../../.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. The TypeORM CLI cannot connect to Postgres.');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Category, Transaction, ExchangeRate],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false, 
  ssl: {
    rejectUnauthorized: false,
  },
});
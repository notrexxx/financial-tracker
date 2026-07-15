import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { User } from '../entities/user.entity';
import { Category, CategoryType } from '../entities/category.entity';
import { Transaction } from '../entities/transaction.entity';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

async function runSeed() {
  console.log('🌱 Initiating Database Seeder...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in the environment variables.');
  }

  const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User, Category, Transaction],
    ssl: { rejectUnauthorized: false },
  });

  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  
  try {
    console.log('🧹 Clearing existing data...');
    await queryRunner.query(`TRUNCATE TABLE transactions, categories, users CASCADE;`);

    console.log('👤 Generating Admin User with Clerk Identity...');
    const userRepo = AppDataSource.getRepository(User);
    
    const demoUser = await userRepo.save({
      id: 'user_3GHoR6yTlblgtvsIJFtdBhZtEcK',
      email: 'admin@admin.com',
      passwordHash: 'managed_by_clerk_oauth',
    });

    console.log('📂 Generating Categories...');
    const categoryRepo = AppDataSource.getRepository(Category);
    const categoriesToCreate = [
      { name: 'Salary', type: CategoryType.INCOME, color: '#10B981' },
      { name: 'Dividends', type: CategoryType.INCOME, color: '#34D399' },
      { name: 'Housing', type: CategoryType.EXPENSE, color: '#EF4444' },
      { name: 'Groceries', type: CategoryType.EXPENSE, color: '#F87171' },
      { name: 'Technology', type: CategoryType.EXPENSE, color: '#60A5FA' },
    ];
    const categories = await categoryRepo.save(categoriesToCreate);

    console.log('💸 Generating 10,000 Transactions (Chunked)...');
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const transactions = [];

    for (let i = 0; i < 10000; i++) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const isIncome = randomCategory.type === CategoryType.INCOME;
      
      transactions.push({
        amount: parseFloat(faker.finance.amount({ min: 5, max: isIncome ? 5000 : 500, dec: 2 })),
        date: faker.date.past({ years: 1 }),
        description: faker.finance.transactionDescription(),
        user: demoUser,
        category: randomCategory,
      });
    }

    const chunkSize = 1000;
    for (let i = 0; i < transactions.length; i += chunkSize) {
      const chunk = transactions.slice(i, i + chunkSize);
      await transactionRepo.insert(chunk);
      console.log(`✅ Inserted chunk ${i / chunkSize + 1} / ${transactions.length / chunkSize}`);
    }

    console.log('🚀 Database Seeding Complete! View your Neon dashboard to verify.');
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

runSeed();
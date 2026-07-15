import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Transaction } from '../database/entities/transaction.entity';
import { User } from '../database/entities/user.entity';
import { Category, CategoryType } from '../database/entities/category.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  // --- JUST-IN-TIME PROVISIONING ENGINE ---
  async autoProvisionUser(userId: string) {
    // 1. Check if user exists in Postgres. If not, auto-register them.
    let user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.log(`Provisioning new user identity in database: ${userId}`);
      user = this.userRepo.create({
        id: userId,
        email: `${userId}@auto-provisioned.local`,
        passwordHash: 'managed_by_clerk_oauth',
      });
      await this.userRepo.save(user);
    }

    // 2. If the user already has transactions, skip the seeder to save compute.
    const txCount = await this.transactionRepo.count({ where: { user: { id: userId } } });
    if (txCount > 0) return;

    this.logger.log(`Generating random financial dataset for user: ${userId}`);

    // 3. Ensure global categories exist
    let categories = await this.categoryRepo.find();
    if (categories.length === 0) {
      categories = await this.categoryRepo.save([
        { name: 'Salary', type: CategoryType.INCOME, color: '#10B981' },
        { name: 'Dividends', type: CategoryType.INCOME, color: '#34D399' },
        { name: 'Housing', type: CategoryType.EXPENSE, color: '#EF4444' },
        { name: 'Groceries', type: CategoryType.EXPENSE, color: '#F87171' },
        { name: 'Technology', type: CategoryType.EXPENSE, color: '#60A5FA' },
      ]);
    }

    // 4. Generate 1,200 unique transactions for this specific user
    const transactions = [];
    for (let i = 0; i < 1200; i++) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const isIncome = randomCategory.type === CategoryType.INCOME;
      
      transactions.push({
        amount: parseFloat(faker.finance.amount({ min: 15, max: isIncome ? 4000 : 300, dec: 2 })),
        date: faker.date.past({ years: 1.5 }),
        description: faker.finance.transactionDescription(),
        user: user,
        category: randomCategory,
      });
    }

    // Bulk insert is virtually instant in Postgres
    await this.transactionRepo.insert(transactions);
    this.logger.log(`Successfully seeded 1,200 transactions for ${userId}`);
  }

  // --- UPDATED ANALYTICS LOGIC WITH PERFECT SQL MAPPING ---
  async getMonthlyTrends(userId: string) {
    const rawData = await this.transactionRepo
      .createQueryBuilder('transaction')
      .select("TO_CHAR(transaction.date, 'Mon YYYY')", 'month')
      .addSelect("SUM(CASE WHEN category.type = 'INCOME' THEN transaction.amount ELSE 0 END)", 'totalIncome')
      .addSelect("SUM(CASE WHEN category.type = 'EXPENSE' THEN transaction.amount ELSE 0 END)", 'totalExpense')
      .addSelect("MIN(transaction.date)", 'sortDate') 
      .innerJoin('transaction.category', 'category')
      // FIX: Map strictly to the generated underlying snake_case database foreign key
      .where('transaction.user_id = :userId', { userId })
      .groupBy("TO_CHAR(transaction.date, 'Mon YYYY')")
      .orderBy('"sortDate"', 'ASC') 
      .getRawMany();

    return rawData.map(item => ({
      month: item.month,
      totalIncome: parseFloat(item.totalIncome) || 0,
      totalExpense: parseFloat(item.totalExpense) || 0,
    }));
  }

  async getCategoryBreakdown(userId: string) {
    const rawData = await this.transactionRepo
      .createQueryBuilder('transaction')
      .select('category.name', 'name')
      .addSelect('category.color', 'color')
      .addSelect('SUM(transaction.amount)', 'totalAmount')
      .innerJoin('transaction.category', 'category')
      // FIX: Map strictly to the generated underlying snake_case database foreign key
      .where('transaction.user_id = :userId', { userId })
      .andWhere("category.type = 'EXPENSE'")
      .groupBy('category.name')
      .addGroupBy('category.color')
      .orderBy('"totalAmount"', 'DESC')
      .getRawMany();

    return rawData.map(item => ({
      name: item.name,
      color: item.color,
      totalAmount: parseFloat(item.totalAmount) || 0,
    }));
  }
}
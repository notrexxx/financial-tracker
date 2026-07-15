import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Transaction } from '../database/entities/transaction.entity';
import { User } from '../database/entities/user.entity';
import { Category, CategoryType } from '../database/entities/category.entity';
import { RedisService } from '../redis/redis.service';

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
    // Inject our new Redis Cache layer
    private redisService: RedisService,
  ) {}

  // --- JUST-IN-TIME PROVISIONING ENGINE ---
  async autoProvisionUser(userId: string) {
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

    const txCount = await this.transactionRepo.count({ where: { user: { id: userId } } });
    if (txCount > 0) return;

    this.logger.log(`Generating random financial dataset for user: ${userId}`);

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

    await this.transactionRepo.insert(transactions);
    this.logger.log(`Successfully seeded 1,200 transactions for ${userId}`);
  }

  // --- REDIS-POWERED ANALYTICS LOGIC ---
  async getMonthlyTrends(userId: string) {
    const cacheKey = `analytics:trends:${userId}`;
    
    // 1. Check Redis Memory First (Takes ~2ms)
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      this.logger.log(`[CACHE HIT] Serving Monthly Trends for ${userId} from Redis`);
      return cachedData;
    }

    this.logger.log(`[CACHE MISS] Calculating Monthly Trends for ${userId} via Postgres`);
    
    // 2. Fallback to Postgres if cache is empty
    const rawData = await this.transactionRepo
      .createQueryBuilder('transaction')
      .select("TO_CHAR(transaction.date, 'Mon YYYY')", 'month')
      .addSelect("SUM(CASE WHEN category.type = 'INCOME' THEN transaction.amount ELSE 0 END)", 'totalIncome')
      .addSelect("SUM(CASE WHEN category.type = 'EXPENSE' THEN transaction.amount ELSE 0 END)", 'totalExpense')
      .addSelect("MIN(transaction.date)", 'sortDate') 
      .innerJoin('transaction.category', 'category')
      .where('transaction.user_id = :userId', { userId })
      .groupBy("TO_CHAR(transaction.date, 'Mon YYYY')")
      .orderBy('"sortDate"', 'ASC') 
      .getRawMany();

    const formattedData = rawData.map(item => ({
      month: item.month,
      totalIncome: parseFloat(item.totalIncome) || 0,
      totalExpense: parseFloat(item.totalExpense) || 0,
    }));

    // 3. Save the result in Redis for 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, formattedData, 300);
    return formattedData;
  }

  async getCategoryBreakdown(userId: string) {
    const cacheKey = `analytics:categories:${userId}`;
    
    // 1. Check Redis Memory First
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      this.logger.log(`[CACHE HIT] Serving Category Breakdown for ${userId} from Redis`);
      return cachedData;
    }

    this.logger.log(`[CACHE MISS] Calculating Category Breakdown for ${userId} via Postgres`);

    // 2. Fallback to Postgres
    const rawData = await this.transactionRepo
      .createQueryBuilder('transaction')
      .select('category.name', 'name')
      .addSelect('category.color', 'color')
      .addSelect('SUM(transaction.amount)', 'totalAmount')
      .innerJoin('transaction.category', 'category')
      .where('transaction.user_id = :userId', { userId })
      .andWhere("category.type = 'EXPENSE'")
      .groupBy('category.name')
      .addGroupBy('category.color')
      .orderBy('"totalAmount"', 'DESC')
      .getRawMany();

    const formattedData = rawData.map(item => ({
      name: item.name,
      color: item.color,
      totalAmount: parseFloat(item.totalAmount) || 0,
    }));

    // 3. Save the result in Redis for 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, formattedData, 300);
    return formattedData;
  }
}
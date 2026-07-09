import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { CategoryType } from '../database/entities/category.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  /**
   * Aggregates 12 months of transactions into a monthly time-series array.
   * Time Complexity: O(log N) due to the composite index on idx_user_date.
   */
  async getMonthlyTrends(userId: string) {
    const trends = await this.transactionRepo
      .createQueryBuilder('transaction')
      .innerJoin('transaction.category', 'category')
      // Group dates by YYYY-MM format natively in Postgres
      .select("TO_CHAR(transaction.date, 'YYYY-MM')", 'month')
      // Conditionally sum amounts based on the joined category type
      .addSelect(
        `SUM(CASE WHEN category.type = '${CategoryType.INCOME}' THEN transaction.amount ELSE 0 END)`,
        'totalIncome',
      )
      .addSelect(
        `SUM(CASE WHEN category.type = '${CategoryType.EXPENSE}' THEN transaction.amount ELSE 0 END)`,
        'totalExpense',
      )
      .where('transaction.user_id = :userId', { userId })
      .groupBy("TO_CHAR(transaction.date, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    // Map strings to floats since Postgres SUM() returns numeric strings
    return trends.map((trend) => ({
      month: trend.month,
      totalIncome: parseFloat(trend.totalIncome) || 0,
      totalExpense: parseFloat(trend.totalExpense) || 0,
    }));
  }

  /**
   * Aggregates total spending grouped strictly by expense categories.
   */
  async getCategoryBreakdown(userId: string) {
    const breakdown = await this.transactionRepo
      .createQueryBuilder('transaction')
      .innerJoin('transaction.category', 'category')
      .select('category.name', 'name')
      .addSelect('category.color', 'color')
      .addSelect('SUM(transaction.amount)', 'totalAmount')
      .where('transaction.user_id = :userId', { userId })
      .andWhere('category.type = :type', { type: CategoryType.EXPENSE })
      .groupBy('category.name, category.color')
      .orderBy('"totalAmount"', 'DESC')
      .getRawMany();

    return breakdown.map((item) => ({
      name: item.name,
      color: item.color,
      totalAmount: parseFloat(item.totalAmount) || 0,
    }));
  }
}
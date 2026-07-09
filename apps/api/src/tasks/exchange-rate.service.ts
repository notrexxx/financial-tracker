import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ExchangeRate } from '../database/entities/exchange-rate.entity';

@Injectable()
export class ExchangeRateService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly API_URL = 'https://open.er-api.com/v6/latest/USD';

  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepo: Repository<ExchangeRate>,
  ) {}

  async onModuleInit() {
    this.logger.log('Bootstrapping Initial Exchange Rate Sync...');
    await this.syncExchangeRates();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailySync() {
    this.logger.log('Executing midnight cron job: syncExchangeRates');
    await this.syncExchangeRates();
  }

  private async syncExchangeRates() {
    try {
      const response = await axios.get(this.API_URL);
      const data = response.data;

      if (data.result !== 'success') {
        throw new Error('Upstream API failed to return successful payload.');
      }

      const today = new Date();
      const rates = data.rates;
      const targetCurrencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
      
      const recordsToUpsert = targetCurrencies.map((currency) => ({
        baseCurrency: 'USD',
        targetCurrency: currency,
        rate: rates[currency],
        date: today,
      }));

      await this.exchangeRateRepo
        .createQueryBuilder()
        .insert()
        .into(ExchangeRate)
        .values(recordsToUpsert)
        .orIgnore()
        .execute();

      this.logger.log(`Successfully synchronized ${targetCurrencies.length} currency exchange rates.`);
    } catch (error) {
      this.logger.error('CRITICAL: Failed to synchronize exchange rates.', error);
    }
  }
}
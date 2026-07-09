import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('exchange_rates')
@Index('idx_currency_date', ['targetCurrency', 'date'], { unique: true })
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  baseCurrency!: string;

  @Column()
  targetCurrency!: string;

  @Column('decimal', { precision: 10, scale: 6 })
  rate!: number;

  @Column({ type: 'date' })
  date!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
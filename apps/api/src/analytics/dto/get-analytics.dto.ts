import { IsUUID, IsNotEmpty } from 'class-validator';

export class GetAnalyticsDto {
  @IsNotEmpty({ message: 'User ID is required to fetch analytics.' })
  @IsUUID('4', { message: 'Invalid User ID format. Must be a valid UUID.' })
  userId!: string;
}
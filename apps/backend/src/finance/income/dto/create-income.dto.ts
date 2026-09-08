import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateIncomeDto {
  @IsDateString()
  date: string;

  @IsUUID()
  categoryId: string;

  @IsString()
  @MinLength(2)
  description: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;
}

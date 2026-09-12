import { IsOptional, IsString, MinLength } from 'class-validator';

export class VoidTransactionDto {
  @IsString()
  @MinLength(3)
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

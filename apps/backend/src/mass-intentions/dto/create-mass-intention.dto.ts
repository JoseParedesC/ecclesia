import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateMassIntentionDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsString()
  intentionType?: string;

  @IsString()
  @MinLength(2)
  description: string;

  @IsString()
  @MinLength(2)
  requesterName: string;

  @IsOptional()
  @IsString()
  requesterPhone?: string;

  @IsNumber()
  @IsPositive()
  expectedAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

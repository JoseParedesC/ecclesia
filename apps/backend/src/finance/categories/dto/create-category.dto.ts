import { IsEnum, IsString, MinLength } from 'class-validator';
import { CategoryType } from '@prisma/client';

export class CreateCategoryDto {
  @IsEnum(CategoryType)
  type: CategoryType;

  @IsString()
  @MinLength(2)
  name: string;
}

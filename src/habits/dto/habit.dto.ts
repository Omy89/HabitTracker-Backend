import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Category, Frequency, Priority } from '@prisma/client';

export class HabitDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(Category)
  category: Category;

  @IsEnum(Frequency)
  frequency: Frequency;

  @IsEnum(Priority)
  priority: Priority;

  @IsString()
  @MinLength(1)
  startDate: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

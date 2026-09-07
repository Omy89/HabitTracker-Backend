import { IsInt, Max, Min } from 'class-validator';

export class ProgressDto {
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;
}

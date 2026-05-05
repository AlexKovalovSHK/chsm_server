import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateAcademicYearDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;
}
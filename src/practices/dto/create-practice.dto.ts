import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export enum PracticeType {
  LITURGICAL = 'LITURGICAL',
  PEDAGOGICAL = 'PEDAGOGICAL',
}

export class CreatePracticeDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ enum: PracticeType })
  @IsEnum(PracticeType)
  @IsNotEmpty()
  practiceType: PracticeType;
}

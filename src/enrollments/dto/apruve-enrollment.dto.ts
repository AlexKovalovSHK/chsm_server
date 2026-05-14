import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApprovedEnrollment {
  @ApiPropertyOptional({
    description: 'ID или имя пользователя, подтвердившего зачисление',
  })
  @IsString()
  @IsNotEmpty()
  approvedBy: string;
}

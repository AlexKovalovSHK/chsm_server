import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  username?: string;

  @ApiProperty({ required: false })
  tel?: string;

  @ApiProperty({ required: false })
  photoUrl?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  tgId?: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  googleId?: string;

  @ApiProperty()
  xp: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  registrationStep: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  isPremium: boolean;

  @ApiProperty()
  metadata: Record<string, any>;
}

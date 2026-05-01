import { UserResponseDto } from '../users/application/dto/user-response.dto';

export interface LoginResult {
  accessToken: string;
  user: UserResponseDto;
}

import { UserProfileResponseDto } from './user-profile.response.dto';

export class UserRegisterResponseDto {
  user?: UserProfileResponseDto;
  expiresAt?: string;
  termsRedirect?: boolean;
}

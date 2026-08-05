import { UserProfileResponseDto } from './user-profile.response.dto';

export class LoginCredentialResponseDto {
  user?: UserProfileResponseDto;
  expiresAt?: string;
  twoFactorRedirect?: boolean;
  termsRedirect?: boolean;
}

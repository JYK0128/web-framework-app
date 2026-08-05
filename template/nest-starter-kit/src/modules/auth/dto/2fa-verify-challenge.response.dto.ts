import { UserProfileResponseDto } from './user-profile.response.dto';

export class Verify2FAChallengeResponseDto {
  ok!: boolean;
  user?: UserProfileResponseDto;
  expiresAt?: string;
  termsRedirect?: boolean;
}

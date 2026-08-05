import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

export class TermsAgreeResponseDto {
  ok!: boolean;
  user!: UserProfileResponseDto;
  expiresAt?: string;
}

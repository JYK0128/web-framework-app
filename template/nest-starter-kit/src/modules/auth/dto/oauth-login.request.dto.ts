export class OAuthLoginRequestDto {
  provider!: string;
  accountId!: string;
  email!: string;
  name?: string;
  accessToken?: string;
  refreshToken?: string;
}

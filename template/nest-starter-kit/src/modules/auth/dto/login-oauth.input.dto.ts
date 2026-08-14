export class LoginOAuthInputDto {
  provider!: string;
  accountId!: string;
  email!: string;
  name!: string;
  accessToken?: string | null;
  refreshToken?: string | null;
}

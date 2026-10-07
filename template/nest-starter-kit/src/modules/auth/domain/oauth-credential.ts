export class OAuthCredential {
  constructor(
    public readonly accessToken: string | null,
    public readonly refreshToken: string | null,
  ) {}
}

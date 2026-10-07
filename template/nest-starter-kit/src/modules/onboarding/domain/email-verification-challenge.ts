export class EmailVerificationChallenge {
  constructor(
    public readonly challengeId: string,
    public readonly email: string,
    public readonly code: string,
    public readonly expiresIn: number,
  ) {
    if (!challengeId || !email || !code || expiresIn <= 0) {
      throw new Error('Invalid email verification challenge');
    }
  }

  equals(other: EmailVerificationChallenge): boolean {
    return this.challengeId === other.challengeId
      && this.email === other.email
      && this.code === other.code
      && this.expiresIn === other.expiresIn;
  }
}

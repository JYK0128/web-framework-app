export const AuthKvStoreKey = {
  emailVerificationChallenge: (challengeId: string) => `service:email-verification:${challengeId}`,
  passwordResetChallenge: (challengeId: string) => `service:password-reset:${challengeId}`,
} as const;

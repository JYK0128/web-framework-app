import type { User } from '#/entities/auth/user.entity';

export type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'emailVerified' | 'image' | 'createdAt' | 'updatedAt'>;

export type AuthSession = {
  token: string
  expiresAt: Date
};

export type AuthResult = {
  user: PublicUser
  session: AuthSession
};

export type AuthenticatedRequest = Request & {
  user?: PublicUser
};

import { SetMetadata } from '@nestjs/common';

export const AUTH_MODE_KEY = 'authMode';
export const ALLOW_UNVERIFIED_IDENTITY_KEY = 'allowUnverifiedIdentity';
export const ALLOW_TWO_FACTOR_ENROLLMENT_KEY = 'allowTwoFactorEnrollment';
// Internal reflection metadata key; it never contains a credential.
// eslint-disable-next-line sonarjs/no-hardcoded-passwords
export const ALLOW_PASSWORD_EXPIRED_KEY = 'allowExpiredAuth';

export type AuthMode = 'public' | 'user' | 'machine';

export const AuthMode = (mode: AuthMode) => SetMetadata(AUTH_MODE_KEY, mode);

export const Public = () => AuthMode('public');

export const UserAuth = () => AuthMode('user');

export const MachineAuth = () => AuthMode('machine');

export const AllowTwoFactorEnrollment = () => SetMetadata(ALLOW_TWO_FACTOR_ENROLLMENT_KEY, true);
export const AllowUnverifiedIdentity = () => SetMetadata(ALLOW_UNVERIFIED_IDENTITY_KEY, true);
export const AllowPasswordExpired = () => SetMetadata(ALLOW_PASSWORD_EXPIRED_KEY, true);

import { SetMetadata } from '@nestjs/common';

export const AUTH_MODE_KEY = 'authMode';

export type AuthMode = 'public' | 'user' | 'machine';

export const AuthMode = (mode: AuthMode) => SetMetadata(AUTH_MODE_KEY, mode);

export const Public = () => AuthMode('public');

export const UserAuth = () => AuthMode('user');

export const MachineAuth = () => AuthMode('machine');

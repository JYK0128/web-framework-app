import type { Store } from 'express-session';

export const SESSION_STORE = Symbol('SESSION_STORE');
export type SessionStore = Store;

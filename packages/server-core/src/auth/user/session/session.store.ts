import { type SessionData, Store } from 'express-session';

export abstract class SessionStore extends Store {
  abstract override get(sessionId: string, callback: (error: unknown, session?: SessionData | null) => void): void;
  abstract override set(sessionId: string, session: SessionData, callback?: (error?: unknown) => void): void;
  abstract override touch(sessionId: string, session: SessionData, callback?: (error?: unknown) => void): void;
  abstract override destroy(sessionId: string, callback?: (error?: unknown) => void): void;
  abstract destroyAll(userId: string): Promise<void>;
}

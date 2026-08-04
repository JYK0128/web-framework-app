import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestTrackingContext = {
  ipAddress: string | null
  userAgent: string | null
  referer: string | null
  origin: string | null
  acceptLanguage: string | null
  secChUa: string | null
  secChUaMobile: string | null
  secChUaPlatform: string | null
  doNotTrack: string | null
};

export type RequestContextState = {
  requestId: string
  actorId: string | null
  tracking: RequestTrackingContext
};

export class RequestContext {
  private readonly storage = new AsyncLocalStorage<RequestContextState>();

  run<T>(state: RequestContextState, callback: () => T): T {
    return this.storage.run(state, callback);
  }

  getRequestId(): string | null {
    return this.storage.getStore()?.requestId ?? null;
  }

  getActorId(): string | null {
    return this.storage.getStore()?.actorId ?? null;
  }

  getTracking(): RequestTrackingContext | null {
    return this.storage.getStore()?.tracking ?? null;
  }

  getIpAddress(): string | null {
    return this.getTracking()?.ipAddress ?? null;
  }

  getUserAgent(): string | null {
    return this.getTracking()?.userAgent ?? null;
  }

  setActorId(actorId: string): void {
    const state = this.storage.getStore();
    if (state) state.actorId = actorId;
  }
}

export const requestContext = new RequestContext();

import { z } from 'zod';

const SessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  ttlSeconds: z.number().int().positive(),
});
export type SessionData = z.infer<typeof SessionSchema>;
export type SessionManager = {
  data: Partial<SessionData>
  update: (data: SessionData) => Promise<unknown>
  clear: () => Promise<unknown>
};

type Options = {
  backend: string
  origin: string
  appName: string
  secure: boolean
  idleSeconds: number
  rememberSeconds: number
};

const LOGIN_PATHS = ['/api/v1/auth/login', '/api/v1/auth/login/2fa'];
const REFRESH_PATH = '/api/v1/auth/refresh';
const LOGOUT_PATH = '/api/v1/auth/logout';
const TOKEN_PATHS = [...LOGIN_PATHS, REFRESH_PATH];
const TokenBodySchema = z.looseObject({ data: z.looseObject({ accessToken: z.string().min(1), refreshToken: z.string().min(1).optional() }) });

class SessionError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function cookieValue(headers: Headers, name: string): string | undefined {
  return headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function failure(status: number, code: string): Response {
  return Response.json({ statusCode: status, errorCode: code, message: code }, { status, headers: { 'cache-control': 'no-store' } });
}

/** Start encrypts API credentials in an HttpOnly cookie; plaintext tokens never reach client code. */
export class SessionProxy {
  private readonly options: Options;
  readonly cookieName: string;

  constructor(options: Options) {
    this.options = options;
    this.cookieName = `${options.appName}_session`;
  }

  async handle(request: Request, manager: SessionManager): Promise<Response> {
    try {
      return await this.forward(request, manager);
    }
    catch (error) {
      if (error instanceof SessionError) return failure(error.status, error.code);
      // Never serialize upstream errors: they can include Authorization or refresh credentials.
      return failure(503, 'SESSION_UPSTREAM_UNAVAILABLE');
    }
  }

  private cookie(name: string, value: string, maxAge: number): string {
    return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${this.options.secure ? '; Secure' : ''}`;
  }

  private async upstream(path: string, method: string, headers: Headers, body?: ArrayBuffer | string, signal?: AbortSignal): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      return await fetch(new URL(path, this.options.backend), {
        method,
        headers,
        body,
        redirect: 'manual',
        signal: signal ? AbortSignal.any([signal, controller.signal]) : controller.signal,
      });
    }
    finally {
      // Limit time to headers, preserving long-lived SSE response streams.
      clearTimeout(timeout);
    }
  }

  private async tokens(response: Response): Promise<{ session: SessionData, body: z.infer<typeof TokenBodySchema> }> {
    const body = TokenBodySchema.parse(await response.json());
    const refreshToken = body.data.refreshToken;
    if (!refreshToken) throw new SessionError(502, 'SESSION_TOKEN_RESPONSE_INVALID');
    // These claims come exclusively from the trusted API response, never from browser input.
    const claims = z.object({ rememberMe: z.boolean() }).parse(JSON.parse(Buffer.from(body.data.accessToken.split('.')[1], 'base64url').toString()));
    const ttlSeconds = claims.rememberMe ? this.options.rememberSeconds : this.options.idleSeconds;
    return { session: { accessToken: body.data.accessToken, refreshToken, ttlSeconds }, body };
  }

  // API refresh tokens are single-use. Share concurrent rotations within this server process.
  private readonly refreshes = new Map<string, Promise<SessionData>>();

  private async refresh(current: SessionData, manager: SessionManager): Promise<SessionData> {
    let pending = this.refreshes.get(current.refreshToken);
    if (!pending) {
      pending = (async () => {
        const response = await this.upstream(REFRESH_PATH, 'POST', new Headers({ 'content-type': 'application/json' }), JSON.stringify({ refreshToken: current.refreshToken }), AbortSignal.timeout(30_000));
        if (!response.ok) throw new SessionError(response.status === 401 ? 401 : 502, response.status === 401 ? 'AUTHENTICATION_REQUIRED' : 'SESSION_REFRESH_FAILED');
        return (await this.tokens(response)).session;
      })();
      this.refreshes.set(current.refreshToken, pending);
      const timer = setTimeout(() => this.refreshes.delete(current.refreshToken), 35_000);
      timer.unref();
    }
    try {
      const session = await pending;
      await manager.update(session);
      return session;
    }
    catch (error) {
      await manager.clear();
      throw error;
    }
  }

  private async revoke(session: SessionData): Promise<void> {
    // Logout must revoke the newest token when it overlaps a rotation.
    const pending = this.refreshes.get(session.refreshToken);
    const current = pending ? await pending : session;
    const response = await this.upstream(LOGOUT_PATH, 'POST', new Headers({ 'content-type': 'application/json' }), JSON.stringify({ refreshToken: current.refreshToken }));
    if (!response.ok) throw new SessionError(502, 'SESSION_LOGOUT_FAILED');
    await response.body?.cancel();
  }

  private validate(request: Request, url: URL, path: string, oauthCallback: boolean, oauthCookieName: string): void {
    if (!path.startsWith('/api/')) throw new SessionError(404, 'NOT_FOUND');
    // Validate against the configured public origin, rather than trusting Host/forwarded headers.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)
      && (request.headers.get('origin') !== this.options.origin || request.headers.get('sec-fetch-site') === 'cross-site')) {
      throw new SessionError(403, 'CSRF_VALIDATION_FAILED');
    }
    if (oauthCallback) {
      if (request.method !== 'GET') throw new SessionError(405, 'METHOD_NOT_ALLOWED');
      const state = url.searchParams.get('state');
      if (!state || state !== cookieValue(request.headers, oauthCookieName)) throw new SessionError(403, 'OAUTH_STATE_INVALID');
    }
    if ([...TOKEN_PATHS, LOGOUT_PATH].includes(path) && request.method !== 'POST') throw new SessionError(405, 'METHOD_NOT_ALLOWED');
  }

  private async requestOptions(request: Request, session: SessionData | null): Promise<{ headers: Headers, body: ArrayBuffer | undefined }> {
    const headers = new Headers();
    for (const name of ['content-type', 'accept', 'accept-language', 'last-event-id', 'range', 'if-none-match']) {
      const value = request.headers.get(name);
      if (value !== null) headers.set(name, value);
    }
    // Browser Authorization, Cookie, Origin, user-agent and forwarding headers are never trusted/forwarded.
    if (session) headers.set('authorization', `Bearer ${session.accessToken}`);
    let body: ArrayBuffer | undefined;
    if (!['GET', 'HEAD'].includes(request.method)) {
      if (Number(request.headers.get('content-length')) > 2 * 1024 * 1024) throw new SessionError(413, 'PAYLOAD_TOO_LARGE');
      body = await request.arrayBuffer();
      if (body.byteLength > 2 * 1024 * 1024) throw new SessionError(413, 'PAYLOAD_TOO_LARGE');
    }
    return { headers, body };
  }

  private async establish(session: SessionData, manager: SessionManager): Promise<void> {
    if (manager.data.refreshToken) await this.revoke(manager.data as SessionData);
    await manager.clear();
    await manager.update(session);
  }

  private async oauthResponse(response: Response, outgoing: Headers, oauthBegin: boolean, oauthCookieName: string): Promise<void> {
    if (oauthBegin && response.status === 302) {
      const location = outgoing.get('location');
      if (!location) throw new SessionError(502, 'OAUTH_STATE_INVALID');
      const state = new URL(location).searchParams.get('state');
      if (!state || !/^[A-Za-z0-9_-]+$/.test(state)) throw new SessionError(502, 'OAUTH_STATE_INVALID');
      outgoing.append('set-cookie', this.cookie(oauthCookieName, state, 600));
    }
  }

  private async oauthCallback(request: Request, url: URL, manager: SessionManager, oauthCookieName: string): Promise<Response> {
    const outgoing = new Headers({ 'cache-control': 'private, no-store' });
    outgoing.append('set-cookie', this.cookie(oauthCookieName, '', 0));
    let target = new URL('/login', this.options.origin);
    try {
      if (url.searchParams.has('error')) throw new SessionError(400, 'OAUTH_CANCELLED');
      const response = await this.upstream(url.pathname, 'POST', new Headers({ 'content-type': 'application/json', 'accept-language': request.headers.get('accept-language') ?? '' }), JSON.stringify({ code: url.searchParams.get('code'), state: url.searchParams.get('state') }), request.signal);
      if (!response.ok) {
        const error = z.object({ errorCode: z.string() }).parse(await response.json());
        throw new SessionError(response.status, error.errorCode);
      }
      const tokens = await this.tokens(response);
      const returnTo = z.string().parse(tokens.body.data.returnTo);
      target = new URL(returnTo, this.options.origin);
      if (target.origin !== this.options.origin) throw new SessionError(502, 'OAUTH_CALLBACK_INVALID');
      await this.establish(tokens.session, manager);
    }
    catch (error) {
      target = new URL('/login', this.options.origin);
      target.searchParams.set('error', error instanceof SessionError ? error.code : 'OAUTH_LOGIN_FAILED');
    }
    outgoing.set('location', target.toString());
    return new Response(null, { status: 302, headers: outgoing });
  }

  private async loginResponse(response: Response, outgoing: Headers, manager: SessionManager): Promise<Response> {
    const json = z.looseObject({ data: z.looseObject({ requiresTwoFactor: z.boolean() }) }).parse(await response.clone().json());
    if (json.data.requiresTwoFactor) {
      const data = Object.fromEntries(Object.entries(json.data).filter(([key]) => !['accessToken', 'refreshToken'].includes(key)));
      return Response.json({ ...json, data }, { status: response.status, headers: outgoing });
    }
    const tokens = await this.tokens(response);
    await this.establish(tokens.session, manager);
    const data = Object.fromEntries(Object.entries(tokens.body.data).filter(([key]) => !['accessToken', 'refreshToken'].includes(key)));
    return Response.json({ ...tokens.body, data }, { status: response.status, headers: outgoing });
  }

  private async authenticatedRequest(request: Request, url: URL, headers: Headers, body: ArrayBuffer | undefined, manager: SessionManager, session: SessionData | null, canRefresh: boolean): Promise<Response> {
    let response = await this.upstream(url.pathname + url.search, request.method, headers, body, request.signal);
    if (response.status === 401 && session && canRefresh) {
      await response.body?.cancel();
      session = await this.refresh(session, manager);
      headers.set('authorization', `Bearer ${session.accessToken}`);
      response = await this.upstream(url.pathname + url.search, request.method, headers, body, request.signal);
      if (response.status === 401) await manager.clear();
    }
    return response;
  }

  private async forward(request: Request, manager: SessionManager): Promise<Response> {
    const url = new URL(request.url);
    const path = decodeURIComponent(url.pathname).replace(/\/+/g, '/').replace(/\/$/, '').toLowerCase();
    const oauthMatch = /^\/api\/v1\/auth\/oauth\/([^/]+)(\/callback)?$/.exec(path);
    const oauthCallback = Boolean(oauthMatch?.[2]);
    const oauthBegin = Boolean(oauthMatch && !oauthCallback && oauthMatch[1] !== 'providers');
    const oauthCookieName = `${this.cookieName}_oauth`;
    this.validate(request, url, path, oauthCallback, oauthCookieName);
    const parsed = SessionSchema.safeParse(manager.data);
    const session = parsed.success ? parsed.data : null;
    if (!session && manager.data.accessToken) await manager.clear();
    if (path === REFRESH_PATH) {
      if (!session) throw new SessionError(401, 'AUTHENTICATION_REQUIRED');
      await this.refresh(session, manager);
      return Response.json({ data: {} }, { headers: { 'cache-control': 'no-store' } });
    }

    if (oauthCallback) return this.oauthCallback(request, url, manager, oauthCookieName);

    const { headers, body } = await this.requestOptions(request, session);
    if (path === LOGOUT_PATH) {
      await manager.clear();
      if (session) await this.revoke(session);
      return Response.json({ data: {} }, { headers: { 'cache-control': 'no-store' } });
    }

    const response = await this.authenticatedRequest(request, url, headers, body, manager, session, !LOGIN_PATHS.includes(path) && !oauthMatch);
    const outgoing = new Headers(response.headers);
    for (const name of ['set-cookie', 'content-length', 'content-encoding', 'connection', 'transfer-encoding']) outgoing.delete(name);
    outgoing.set('cache-control', 'private, no-store');

    await this.oauthResponse(response, outgoing, oauthBegin, oauthCookieName);
    if (LOGIN_PATHS.includes(path) && response.ok) return this.loginResponse(response, outgoing, manager);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: outgoing });
  }
}

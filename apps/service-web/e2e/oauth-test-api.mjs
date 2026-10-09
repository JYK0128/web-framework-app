import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const port = Number(process.env.SERVICE_E2E_API_PORT ?? 14104);
const webOrigin = process.env.SERVICE_E2E_WEB_URL ?? 'http://localhost:13104';
const sessions = new Map();
const states = new Map();

function json(response, status, data, path) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify({ success: status < 400, statusCode: status, path, requestId: 'oauth-e2e', timestamp: new Date().toISOString(), data, ...(status < 400 ? {} : { errorCode: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required.' }) }));
}

function token(rememberMe = false) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'oauth-e2e-user', rememberMe })).toString('base64url');
  return `${header}.${payload}.e2e`;
}

function sessionTokens() {
  const accessToken = token();
  const refreshToken = randomUUID();
  sessions.set(refreshToken, { accessToken, revoked: false });
  return { accessToken, refreshToken };
}

async function body(request) {
  let value = '';
  for await (const chunk of request) value += chunk;
  return value ? JSON.parse(value) : {};
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${port}`);
  const path = url.pathname;

  if (path === '/__e2e/health') return json(response, 200, { ready: true }, path);
  if (path === '/__e2e/revoke-sessions' && request.method === 'POST') {
    for (const session of sessions.values()) session.revoked = true;
    return json(response, 200, { revoked: sessions.size }, path);
  }
  if (path === '/__e2e/status') return json(response, 200, { sessions: sessions.size, oauthStarts: states.size }, path);

  if (path === '/api/v1/auth/oauth/providers') {
    return json(response, 200, { items: [{ id: 'e2e', name: 'E2E OAuth' }] }, path);
  }

  if (path === '/api/v1/auth/oauth/e2e' && request.method === 'GET') {
    const state = randomUUID().replaceAll('-', '_');
    const returnTo = url.searchParams.get('callback') ?? '/';
    states.set(state, returnTo);
    const authorize = new URL('/authorize', `http://localhost:${port}`);
    authorize.searchParams.set('state', state);
    authorize.searchParams.set('redirect_uri', `${webOrigin}/api/v1/auth/oauth/e2e/callback`);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('client_id', 'e2e-client');
    authorize.searchParams.set('code_challenge', 'e2e-pkce-challenge');
    authorize.searchParams.set('code_challenge_method', 'S256');
    response.writeHead(302, { location: authorize.toString(), 'cache-control': 'no-store' });
    return response.end();
  }

  if (path === '/authorize') {
    const state = url.searchParams.get('state');
    const redirectUri = url.searchParams.get('redirect_uri');
    if (!state || !states.has(state) || !redirectUri || !url.searchParams.has('code_challenge')) {
      return json(response, 400, {}, path);
    }
    const callback = new URL(redirectUri);
    callback.searchParams.set('code', `e2e-code-${state}`);
    callback.searchParams.set('state', state);
    response.writeHead(302, { location: callback.toString(), 'cache-control': 'no-store' });
    return response.end();
  }

  if (path === '/api/v1/auth/oauth/e2e/callback' && request.method === 'POST') {
    const input = await body(request);
    const returnTo = states.get(input.state);
    if (!returnTo || input.code !== `e2e-code-${input.state}`) {
      return json(response, 400, {}, path);
    }
    states.delete(input.state);
    return json(response, 200, { ...sessionTokens(), returnTo }, path);
  }

  if (path === '/api/v1/auth/refresh' && request.method === 'POST') {
    const input = await body(request);
    const current = sessions.get(input.refreshToken);
    if (!current || current.revoked) return json(response, 401, {}, path);
    current.revoked = true;
    return json(response, 200, sessionTokens(), path);
  }

  if (path === '/api/v1/auth/logout' && request.method === 'POST') {
    const input = await body(request);
    const current = sessions.get(input.refreshToken);
    if (current) current.revoked = true;
    return json(response, 200, { ok: true }, path);
  }

  if (path === '/api/v1/auth/me') {
    const accessToken = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    const current = [...sessions.values()].find((session) => session.accessToken === accessToken && !session.revoked);
    if (!current) return json(response, 401, {}, path);
    return json(response, 200, {
      id: 'oauth-e2e-user', email: 'oauth-e2e@example.test', emailVerified: true, name: 'OAuth E2E', image: null,
      phoneNumber: null, twoFactorEnabled: false, phoneNumberVerified: false, passwordExpired: false,
      roleCode: 'customer', roleLabel: 'Customer', permissions: [], providers: ['e2e'], passwordUpdatedAt: null,
    }, path);
  }

  if (path === '/api/v1/service-terms/agreements') {
    if (!request.headers.authorization) return json(response, 401, {}, path);
    return json(response, 200, { items: [] }, path);
  }

  if (path === '/api/v1/service-configs') {
    return json(response, 200, {
      operation: {
        hours: { start: '00:00', end: '23:59', openDays: [0, 1, 2, 3, 4, 5, 6], lunchBreak: { enabled: false, start: '12:00', end: '13:00' } },
        holidays: [],
        messages: { lunch: '', offHours: '', holiday: '' },
      },
      maintenance: {
        temporary: { enabled: false, message: '', startAt: null, endAt: null },
        recurring: { enabled: false, message: '', daysOfWeek: [], startTime: '00:00', endTime: '00:00' },
      },
    }, path);
  }

  if (path === '/api/v1/qna') {
    if (!request.headers.authorization) return json(response, 401, {}, path);
    return json(response, 200, { page: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false, totalCount: 0, items: [] }, path);
  }

  if (path === '/api/v1/faqs') {
    return json(response, 200, { startCursor: null, endCursor: null, hasNextPage: false, hasPrevPage: false, totalCount: 0, items: [], categories: [] }, path);
  }

  return json(response, 404, {}, path);
});

server.listen(port, '127.0.0.1');

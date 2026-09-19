import assert from 'node:assert';
import test from 'node:test';

import { jwtVerify } from 'jose';

import { MachineTokenService } from './machine-token.service';

void test('MachineTokenService', async (t) => {
  const secret = 'internal-s2s-secret-key-development';
  process.env.INTERNAL_JWT_SECRET = secret;

  const machineTokenService = new MachineTokenService();

  await t.test('초단기 machine JWT 토큰(60초)을 정상적으로 서명 발급해야 한다', async () => {
    const token = await machineTokenService.createMachineToken({
      targetService: 'service-api',
    });

    assert.ok(token, '토큰이 생성되어야 합니다.');

    const { payload: verified } = await jwtVerify<{
      iss: string
      aud: string
      sub: string
      jti: string
      iat: number
      exp: number
    }>(token, new TextEncoder().encode(secret), {
      issuer: 'admin-api',
      audience: 'service-api',
      algorithms: ['HS256'],
    });

    assert.strictEqual(verified.iss, 'admin-api');
    assert.strictEqual(verified.aud, 'service-api');
    assert.strictEqual(verified.sub, 'admin-api');
    assert.deepStrictEqual(Object.keys(verified).sort(), ['aud', 'exp', 'iat', 'iss', 'jti', 'sub']);
    assert.strictEqual(verified.exp - verified.iat, 60, '유효시간은 정확히 60초여야 합니다.');
  });

  await t.test('대상 서비스(audience)가 일치하지 않으면 검증에 실패해야 한다', async () => {
    const token = await machineTokenService.createMachineToken({
      targetService: 'service-api',
    });

    await assert.rejects(async () => {
      await jwtVerify(token, new TextEncoder().encode(secret), {
        issuer: 'admin-api',
        audience: 'other-service',
      });
    });
  });

  await t.test('위조된 시크릿 키로 검증 시 실패해야 한다', async () => {
    const token = await machineTokenService.createMachineToken({
      targetService: 'service-api',
    });

    await assert.rejects(async () => {
      await jwtVerify(token, new TextEncoder().encode('tampered-secret-key'), {
        issuer: 'admin-api',
        audience: 'service-api',
      });
    });
  });
});

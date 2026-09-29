import { createHmac } from 'node:crypto';

import { SECURITY_CONFIG } from '#/config';

export function verifyTotp(secret: string, code: string, digits = SECURITY_CONFIG.twoFactor.codeLength, periodSeconds = SECURITY_CONFIG.twoFactor.periodSeconds, windowSteps = SECURITY_CONFIG.twoFactor.windowSteps): boolean {
  if (!new RegExp(`^\\d{${digits}}$`).test(code)) return false;
  const normalized = secret.toUpperCase();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index < 0) return false;
    bits += index.toString(2).padStart(5, '0');
  }
  const key = Buffer.alloc(Math.floor(bits.length / 8));
  for (let index = 0; index < key.length; index += 1) key[index] = Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2);
  const counter = Math.floor(Date.now() / (periodSeconds * 1000));
  const candidate = Number.parseInt(code, 10);
  for (let step = -windowSteps; step <= windowSteps; step += 1) {
    const candidateCounter = counter + step;
    if (candidateCounter < 0) continue;
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(Math.floor(candidateCounter / 0x100000000), 0);
    counterBuffer.writeUInt32BE(candidateCounter >>> 0, 4);
    const digest = createHmac('sha1', key).update(counterBuffer).digest();
    const offset = digest[digest.length - 1] & 0xf;
    const value = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
    if (value % (10 ** digits) === candidate) return true;
  }
  return false;
}

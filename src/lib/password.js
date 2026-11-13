// Хеширование паролей на встроенном crypto (scrypt) — без внешних зависимостей.
import crypto from 'node:crypto';

const KEY_LEN = 64;

export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plain), salt, KEY_LEN).toString('hex');
  return salt + ':' + hash;
}

export function verifyPassword(plain, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const parts = stored.split(':');
  const salt = parts[0];
  const expected = Buffer.from(parts[1], 'hex');
  const actual = crypto.scryptSync(String(plain), salt, KEY_LEN);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

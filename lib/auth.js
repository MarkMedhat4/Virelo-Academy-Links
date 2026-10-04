// Admin authentication: scrypt password hashes (from env) + HMAC-signed, HttpOnly session cookies.
import { scrypt as scryptCb, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import { json, parseCookies, isSecureRequest } from './http.js';

const scrypt = promisify(scryptCb);
const N = 16384, R = 8, P = 1, KEYLEN = 64;
export const COOKIE_NAME = 'vl_session';
export const SESSION_SECONDS = 60 * 60 * 8; // 8 hours

export class ConfigError extends Error {}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(keyB64, 'base64');
  const key = await scrypt(password, salt, expected.length, { N: +n, r: +r, p: +p, maxmem: 128 * 1024 * 1024 });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

let cachedRaw, cachedAccounts = [];
export function getAccounts() {
  const raw = process.env.ADMIN_ACCOUNTS;
  if (!raw) throw new ConfigError('ADMIN_ACCOUNTS is not set');
  if (raw !== cachedRaw) {
    let parsed;
    try { parsed = JSON.parse(raw); } catch { throw new ConfigError('ADMIN_ACCOUNTS is not valid JSON'); }
    if (!Array.isArray(parsed)) throw new ConfigError('ADMIN_ACCOUNTS must be an array');
    cachedAccounts = parsed.filter((a) => a && a.username && a.name && String(a.hash).startsWith('scrypt$'));
    cachedRaw = raw;
  }
  return cachedAccounts;
}

let dummyHash;
export async function authenticate(username, password) {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.username.toLowerCase() === String(username).trim().toLowerCase());
  if (!account) {
    // Burn comparable CPU time so response time does not reveal which usernames exist.
    dummyHash ??= await hashPassword('virelo-dummy-password');
    await verifyPassword(String(password), dummyHash);
    return null;
  }
  const ok = await verifyPassword(String(password), account.hash);
  return ok ? { username: account.username, name: account.name } : null;
}

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new ConfigError('SESSION_SECRET must be set (32+ characters)');
  return s;
}
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const sign = (data) => createHmac('sha256', secret()).update(data).digest();

export function createSession(user) {
  const now = Math.floor(Date.now() / 1000);
  const body = b64u(JSON.stringify({ sub: user.username, name: user.name, iat: now, exp: now + SESSION_SECONDS }));
  return `${body}.${b64u(sign(body))}`;
}

export function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { username: payload.sub, name: payload.name };
  } catch {
    return null;
  }
}

export function sessionCookie(token, req) {
  return [`${COOKIE_NAME}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${SESSION_SECONDS}`, isSecureRequest(req) ? 'Secure' : '']
    .filter(Boolean).join('; ');
}
export function clearCookie(req) {
  return [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0', isSecureRequest(req) ? 'Secure' : '']
    .filter(Boolean).join('; ');
}

export function getSession(req) {
  return verifySession(parseCookies(req)[COOKIE_NAME]);
}

// Server-side authorization gate used by every admin API route.
export function requireAdmin(req, res) {
  const user = getSession(req);
  if (!user) {
    json(res, 401, { error: 'unauthorized' });
    return null;
  }
  return user;
}

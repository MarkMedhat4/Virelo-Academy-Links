import { json, methodNotAllowed, readJson, sameOrigin, clientIp, safe } from '../../lib/http.js';
import { authenticate, createSession, sessionCookie, ConfigError } from '../../lib/auth.js';
import { getStore } from '../../lib/store.js';

const MAX_FAILURES = 10;         // per IP …
const WINDOW_SECONDS = 15 * 60;  // … per 15 minutes

export default safe(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!sameOrigin(req)) return json(res, 403, { error: 'forbidden' });

  const body = await readJson(req);
  const username = typeof body.username === 'string' ? body.username.slice(0, 100) : '';
  const password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';
  if (!username || !password) return json(res, 401, { error: 'invalid_credentials' });

  const store = getStore();
  const rateKey = `virelo:rl:login:${clientIp(req)}`;
  if ((await store.peek(rateKey)) >= MAX_FAILURES) return json(res, 429, { error: 'too_many_attempts' });

  try {
    const user = await authenticate(username, password);
    if (!user) {
      await store.incr(rateKey, WINDOW_SECONDS);
      return json(res, 401, { error: 'invalid_credentials' });
    }
    await store.del(rateKey);
    res.setHeader('Set-Cookie', sessionCookie(createSession(user), req));
    json(res, 200, { user });
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error('[auth] configuration error:', err.message);
      return json(res, 500, { error: 'server_error' });
    }
    throw err;
  }
});

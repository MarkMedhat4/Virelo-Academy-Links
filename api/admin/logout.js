import { json, methodNotAllowed, sameOrigin, safe } from '../../lib/http.js';
import { clearCookie } from '../../lib/auth.js';

export default safe(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!sameOrigin(req)) return json(res, 403, { error: 'forbidden' });
  res.setHeader('Set-Cookie', clearCookie(req));
  json(res, 200, { ok: true });
});

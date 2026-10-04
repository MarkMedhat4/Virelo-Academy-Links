// /admin/dashboard is rewritten here (see vercel.json). The dashboard HTML is only ever sent to a
// request carrying a valid session; everyone else is redirected to the login screen at /admin.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getSession } from '../../lib/auth.js';
import { methodNotAllowed, safe } from '../../lib/http.js';

let html;
export default safe(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return methodNotAllowed(res, ['GET', 'HEAD']);
  if (!getSession(req)) {
    res.statusCode = 302;
    res.setHeader('Location', '/admin');
    res.setHeader('Cache-Control', 'no-store');
    return res.end();
  }
  html ??= readFileSync(join(process.cwd(), 'private', 'dashboard.html'), 'utf8');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(req.method === 'HEAD' ? undefined : html);
});

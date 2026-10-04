// Small framework-agnostic HTTP helpers (work with Vercel functions and scripts/dev-server.mjs).

export function json(res, status, body, { cache = 'no-store' } = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(body));
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  json(res, 405, { error: 'method_not_allowed' });
}

export function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export async function readJson(req, limit = 64 * 1024) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8') || '{}');
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('payload too large'), { status: 413 });
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

// CSRF defence in depth (cookies are also SameSite=Strict): browsers always send Origin on
// state-changing requests, so a mismatching Origin is rejected.
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.socket?.remoteAddress || 'unknown';
}

export function isSecureRequest(req) {
  return req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
}

export function routeId(req) {
  const fromQuery = req.query && req.query.id;
  if (fromQuery) return String(Array.isArray(fromQuery) ? fromQuery[0] : fromQuery);
  const path = new URL(req.url, 'http://x').pathname.replace(/\/+$/, '');
  return decodeURIComponent(path.split('/').pop() || '');
}

// Wrap a handler so unexpected errors never leak internals to the client.
export function safe(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (err && err.status === 413) return json(res, 413, { error: 'payload_too_large' });
      if (err instanceof SyntaxError) return json(res, 400, { error: 'bad_request' });
      console.error('[api] unexpected error:', err && err.name, err && err.message);
      if (!res.headersSent) json(res, 500, { error: 'server_error' });
    }
  };
}

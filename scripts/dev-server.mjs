// Local development server that mirrors the Vercel setup: static files from /public,
// serverless functions from /api, plus the rewrites and headers declared in vercel.json.
//   npm run dev   →  http://localhost:3000
import http from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);

// Minimal .env.local loader (no dependency). Existing environment variables win.
for (const file of ['.env.local', '.env']) {
  const full = path.join(ROOT, file);
  if (!existsSync(full)) continue;
  for (const line of readFileSync(full, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let value = m[2];
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    if (value !== '' && !(m[1] in process.env)) process.env[m[1]] = value;
  }
}

const config = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain'
};

function resolveApi(dir, segs, params = {}) {
  if (!segs.length) {
    const idx = path.join(dir, 'index.js');
    return existsSync(idx) ? { file: idx, params } : null;
  }
  const [seg, ...rest] = segs;
  if (seg.includes('..') || seg.includes('/') || seg.includes('\\')) return null;
  if (!rest.length) {
    const f = path.join(dir, `${seg}.js`);
    if (existsSync(f)) return { file: f, params };
  }
  const sub = path.join(dir, seg);
  if (existsSync(sub) && statSync(sub).isDirectory()) {
    const r = resolveApi(sub, rest, params);
    if (r) return r;
  }
  for (const entry of readdirSync(dir)) {
    const file = entry.match(/^\[(.+)\]\.js$/);
    if (file && !rest.length) return { file: path.join(dir, entry), params: { ...params, [file[1]]: seg } };
    const folder = entry.match(/^\[(.+)\]$/);
    if (folder && statSync(path.join(dir, entry)).isDirectory()) {
      const r = resolveApi(path.join(dir, entry), rest, { ...params, [folder[1]]: seg });
      if (r) return r;
    }
  }
  return null;
}

function applyHeaders(pathname, res) {
  for (const rule of config.headers || []) {
    if (new RegExp(`^${rule.source}$`).test(pathname)) {
      for (const h of rule.headers) res.setHeader(h.key, h.value);
    }
  }
}

function serveStatic(pathname, res) {
  const base = path.join(ROOT, 'public');
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { rel = pathname; }
  const candidates = rel.endsWith('/')
    ? [rel + 'index.html']
    : [rel, rel + '.html', rel + '/index.html'];
  for (const c of candidates) {
    const full = path.normalize(path.join(base, c));
    if (!full.startsWith(base)) break;
    if (existsSync(full) && statSync(full).isFile()) {
      res.statusCode = 200;
      res.setHeader('Content-Type', MIME[path.extname(full)] || 'application/octet-stream');
      return res.end(readFileSync(full));
    }
  }
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found');
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let pathname = url.pathname;
    applyHeaders(pathname, res);
    for (const r of config.rewrites || []) if (r.source === pathname) pathname = r.destination;

    if (pathname.startsWith('/api/')) {
      const found = resolveApi(path.join(ROOT, 'api'), pathname.slice(5).split('/').filter(Boolean));
      if (!found) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end('{"error":"not_found"}');
      }
      req.query = { ...Object.fromEntries(url.searchParams), ...found.params };
      const chunks = [];
      for await (const c of req) chunks.push(c);
      if (chunks.length) req.body = Buffer.concat(chunks).toString('utf8');
      const mod = await import(pathToFileURL(found.file).href);
      return mod.default(req, res);
    }
    serveStatic(pathname, res);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, () => console.log(`Virelo Links dev server → http://localhost:${port}`));
}

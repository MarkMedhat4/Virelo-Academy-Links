import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from '../scripts/dev-server.mjs';
import { hashPassword } from '../lib/auth.js';
import { startMockUpstash } from './mock-upstash.mjs';

const PW = { alice: 'Test-Password-Alice-1!', bob: 'Test-Password-Bob-2!' };
let server, base, tmp, mock;

async function boot({ upstash } = {}) {
  process.env.SESSION_SECRET = 'x'.repeat(48);
  process.env.ADMIN_ACCOUNTS = JSON.stringify([
    { username: 'alice.test', name: 'Alice Test', hash: await hashPassword(PW.alice) },
    { username: 'bob.test', name: 'Bob Test', hash: await hashPassword(PW.bob) }
  ]);
  tmp = mkdtempSync(join(tmpdir(), 'virelo-'));
  process.env.VIRELO_DEV_STORE = join(tmp, 'store.json');
  delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstash) { process.env.UPSTASH_REDIS_REST_URL = upstash.url; process.env.UPSTASH_REDIS_REST_TOKEN = upstash.token; }
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
}
const call = (path, { method = 'GET', body, cookie, headers = {} } = {}) =>
  fetch(base + path, {
    method, redirect: 'manual',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
async function login(user = 'alice.test', pw = PW.alice) {
  const res = await call('/api/admin/login', { method: 'POST', body: { username: user, password: pw } });
  return { res, cookie: (res.headers.get('set-cookie') || '').split(';')[0] };
}

before(() => boot());
after(() => { server.close(); rmSync(tmp, { recursive: true, force: true }); });

test('public API seeds the official links first, then the original links, sorted by order', async () => {
  const { links } = await (await call('/api/links')).json();
  assert.equal(links.length, 9);
  assert.deepEqual(links.slice(0, 3).map((l) => l.url), [
    'https://virelo-academy-system.vercel.app',
    'https://virelo-academy-system.vercel.app/register',
    'https://virelo-academy-system.vercel.app/payment'
  ]);
  assert.equal(links[1].title, 'تسجيل البيانات');
  assert.equal(links[2].title, 'دفع الحصة');
  assert.equal(links[1].translations.en.title, 'Student Registration');
  assert.deepEqual(links.map((l) => l.order), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.ok(links.slice(3).some((l) => l.url === 'https://www.tiktok.com/@virelo%20academy'));
  assert.equal(links.every((l) => !('enabled' in l) && !('createdAt' in l)), true, 'public shape has no admin fields');
});

test('public links endpoint: browsers always revalidate, CDN caches briefly', async () => {
  const res = await call('/api/links');
  assert.equal(res.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
  assert.match(res.headers.get('vercel-cdn-cache-control'), /max-age=15/);
});

test('public users cannot read the admin list or modify anything', async () => {
  assert.equal((await call('/api/admin/links')).status, 401);
  assert.equal((await call('/api/admin/links', { method: 'POST', body: { title: 'x' } })).status, 401);
  assert.equal((await call('/api/admin/links/abc', { method: 'DELETE' })).status, 401);
  assert.equal((await call('/api/admin/links/abc', { method: 'PATCH', body: { enabled: false } })).status, 401);
  assert.equal((await call('/api/links', { method: 'POST', body: {} })).status, 405);
});

test('login: wrong credentials rejected with a generic error; correct ones set a hardened cookie', async () => {
  for (const [u, p] of [['alice.test', 'nope'], ['ghost', PW.alice], ['', '']]) {
    const res = await call('/api/admin/login', { method: 'POST', body: { username: u, password: p } });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: 'invalid_credentials' });
  }
  const { res, cookie } = await login();
  assert.equal(res.status, 200);
  const raw = res.headers.get('set-cookie');
  assert.match(raw, /HttpOnly/); assert.match(raw, /SameSite=Strict/); assert.match(raw, /Path=\//);
  assert.ok(cookie.startsWith('vl_session='));
  assert.equal((await (await call('/api/admin/session', { cookie })).json()).user.name, 'Alice Test');
  assert.equal((await login('bob.test', PW.bob)).res.status, 200);
});

test('session cookies cannot be forged or tampered with', async () => {
  const { cookie } = await login();
  const [name, value] = cookie.split('=');
  const [body, sig] = value.split('.');
  const forged = Buffer.from(JSON.stringify({ sub: 'x', name: 'Mallory', iat: 1, exp: 9999999999 })).toString('base64url');
  for (const bad of [`${name}=${forged}.${sig}`, `${name}=${body}.AAAA`, `${name}=garbage`]) {
    assert.equal((await call('/api/admin/session', { cookie: bad })).status, 401);
  }
});

test('/admin/dashboard is only served to authenticated admins; others are redirected to /admin', async () => {
  const anon = await call('/admin/dashboard');
  assert.equal(anon.status, 302);
  assert.equal(anon.headers.get('location'), '/admin');
  const { cookie } = await login();
  const ok = await call('/admin/dashboard', { cookie });
  assert.equal(ok.status, 200);
  assert.match(await ok.text(), /Virelo Links/);
  const login_page = await call('/admin');
  assert.equal(login_page.status, 200);
  assert.equal((await call('/private/dashboard.html')).status, 404, 'dashboard source is not publicly reachable');
  assert.equal((await call('/lib/auth.js')).status, 404, 'server code is not publicly reachable');
});

test('CRUD, ordering, featured and enabled state', async () => {
  const { cookie } = await login();
  const create = await call('/api/admin/links', { method: 'POST', cookie, body: {
    title: '  Telegram   Channel ', description: 'Join us', url: 'https://t.me/virelo', icon: 'telegram',
    category: 'social', featured: false, enabled: true, order: 0 } });
  assert.equal(create.status, 201);
  const { link } = await create.json();
  assert.equal(link.title, 'Telegram Channel');
  assert.equal(link.category, 'Social', 'category reuses existing spelling');
  assert.ok(link.id && link.createdAt && link.updatedAt);

  let pub = (await (await call('/api/links')).json()).links;
  assert.equal(pub[0].id, link.id, 'order 0 sorts first');

  const dis = await call(`/api/admin/links/${link.id}`, { method: 'PATCH', cookie, body: { enabled: false } });
  assert.equal((await dis.json()).link.enabled, false);
  pub = (await (await call('/api/links')).json()).links;
  assert.equal(pub.some((l) => l.id === link.id), false, 'disabled link hidden publicly');
  const adminList = (await (await call('/api/admin/links', { cookie })).json()).links;
  assert.equal(adminList.some((l) => l.id === link.id), true, 'disabled link stays in admin');

  const upd = await call(`/api/admin/links/${link.id}`, { method: 'PATCH', cookie, body: { enabled: true, featured: true, order: 99, title: 'Telegram' } });
  const updated = (await upd.json()).link;
  assert.equal(updated.featured, true); assert.equal(updated.createdAt, link.createdAt);
  assert.notEqual(updated.updatedAt, link.updatedAt);
  pub = (await (await call('/api/links')).json()).links;
  assert.equal(pub.at(-1).id, link.id, 'order 99 sorts last');

  assert.equal((await call(`/api/admin/links/${link.id}`, { method: 'DELETE', cookie })).status, 200);
  assert.equal((await call(`/api/admin/links/${link.id}`, { method: 'DELETE', cookie })).status, 404);
  assert.equal((await call('/api/admin/links/nope', { method: 'PATCH', cookie, body: { enabled: true } })).status, 404);
});

test('validation rejects empty, malformed and dangerous input', async () => {
  const { cookie } = await login();
  const good = { title: 'T', description: '', url: 'https://example.com', icon: 'website', category: 'Other', featured: false, enabled: true, order: 5 };
  const cases = [
    [{ ...good, title: '   ' }, 'title', 'required'],
    [{ ...good, url: '' }, 'url', 'required'],
    [{ ...good, url: 'not a url' }, 'url', 'invalid_url'],
    [{ ...good, url: 'javascript:alert(1)' }, 'url', 'invalid_url'],
    [{ ...good, url: 'https://user:pw@example.com' }, 'url', 'invalid_url'],
    [{ ...good, category: '' }, 'category', 'required'],
    [{ ...good, icon: 'emoji' }, 'icon', 'invalid_icon'],
    [{ ...good, order: 'abc' }, 'order', 'not_number'],
    [{ ...good, order: 1.5 }, 'order', 'not_number'],
    [{ ...good, order: -1 }, 'order', 'out_of_range'],
    [{ ...good, description: 'x'.repeat(241) }, 'description', 'too_long'],
    [{ ...good, enabled: 'yes' }, 'enabled', 'invalid_boolean']
  ];
  for (const [body, field, code] of cases) {
    const res = await call('/api/admin/links', { method: 'POST', cookie, body });
    assert.equal(res.status, 422, `${field}:${code}`);
    assert.equal((await res.json()).errors[field], code);
  }
  const bad = await fetch(base + '/api/admin/links', { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: '{oops' });
  assert.equal(bad.status, 400);
});

test('cross-origin state-changing requests are rejected', async () => {
  const { cookie } = await login();
  const res = await call('/api/admin/links', { method: 'POST', cookie, headers: { Origin: 'https://evil.example' },
    body: { title: 'T', url: 'https://example.com', icon: 'website', category: 'Other', featured: false, enabled: true } });
  assert.equal(res.status, 403);
  const lo = await call('/api/admin/login', { method: 'POST', headers: { Origin: 'https://evil.example' }, body: { username: 'alice.test', password: PW.alice } });
  assert.equal(lo.status, 403);
});

test('logout clears the session cookie', async () => {
  const { cookie } = await login();
  const res = await call('/api/admin/logout', { method: 'POST', cookie });
  assert.match(res.headers.get('set-cookie'), /Max-Age=0/);
});

test('login is rate-limited per IP, even for a correct password afterwards', async () => {
  const ip = { 'X-Forwarded-For': '203.0.113.77' };
  for (let i = 0; i < 10; i++) {
    const r = await call('/api/admin/login', { method: 'POST', headers: ip, body: { username: 'alice.test', password: 'wrong' } });
    assert.equal(r.status, 401);
  }
  const blocked = await call('/api/admin/login', { method: 'POST', headers: ip, body: { username: 'alice.test', password: PW.alice } });
  assert.equal(blocked.status, 429);
  const other = await call('/api/admin/login', { method: 'POST', headers: { 'X-Forwarded-For': '203.0.113.78' }, body: { username: 'alice.test', password: PW.alice } });
  assert.equal(other.status, 200);
});

test('security headers are served', async () => {
  const res = await call('/');
  assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal((await call('/api/admin/session')).headers.get('cache-control'), 'no-store');
});

test('production storage adapter (Upstash REST protocol): seed once, CRUD, persistence across restarts', async () => {
  server.close(); rmSync(tmp, { recursive: true, force: true });
  mock = await startMockUpstash();
  await boot({ upstash: mock });
  const { cookie } = await login();
  let links = (await (await call('/api/admin/links', { cookie })).json()).links;
  assert.equal(links.length, 9);
  assert.equal(mock.hashes.get('virelo:links').size, 9, 'written to the remote store, not a local file');
  const created = (await (await call('/api/admin/links', { method: 'POST', cookie, body: { title: 'Remote', url: 'https://example.com', icon: 'website', category: 'Other', featured: false, enabled: true } })).json()).link;
  // "new deployment": fresh server + same remote database
  server.close();
  await boot({ upstash: mock });
  const again = (await (await call('/api/links')).json()).links;
  assert.equal(again.length, 10);
  assert.ok(again.some((l) => l.id === created.id));
  for (const l of again.filter((x) => x.id !== created.id)) await call(`/api/admin/links/${l.id}`, { method: 'DELETE', cookie: (await login()).cookie });
  assert.equal((await (await call('/api/links')).json()).links.length, 1, 'deleting everything does not re-seed');
  // wrong token → generic 500, no internals leaked
  process.env.UPSTASH_REDIS_REST_TOKEN = 'wrong';
  const failed = await call('/api/links');
  assert.equal(failed.status, 500);
  assert.deepEqual(await failed.json(), { error: 'server_error' });
  mock.close();
});

test('storage refuses to fall back to the dev file store in production', async () => {
  const { getStore } = await import('../lib/store.js');
  delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.VERCEL = '1';
  assert.throws(() => getStore(), /not configured/);
  delete process.env.VERCEL;
});

// Storage adapters. Production = Upstash Redis (REST). Local development = JSON file (never used on Vercel).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export class StoreError extends Error {}

class UpstashStore {
  constructor(url, token) { this.url = url; this.token = token; }
  async cmd(args) {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(8000)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.error) throw new StoreError(`storage request failed (${res.status})`);
    return data.result;
  }
  async hgetall(key) {
    const res = await this.cmd(['HGETALL', key]);
    if (Array.isArray(res)) {
      const out = {};
      for (let i = 0; i < res.length; i += 2) out[res[i]] = res[i + 1];
      return out;
    }
    return res || {};
  }
  hset(key, field, value) { return this.cmd(['HSET', key, field, value]); }
  hdel(key, field) { return this.cmd(['HDEL', key, field]); }
  async setnx(key, value) { return (await this.cmd(['SET', key, value, 'NX'])) === 'OK'; }
  del(key) { return this.cmd(['DEL', key]); }
  async peek(key) { return Number(await this.cmd(['GET', key])) || 0; }
  async incr(key, ttlSeconds) {
    const n = await this.cmd(['INCR', key]);
    if (n === 1) await this.cmd(['EXPIRE', key, ttlSeconds]);
    return n;
  }
}

class FileStore {
  constructor(file) {
    this.file = file;
    this.counters = new Map();
  }
  read() {
    if (!existsSync(this.file)) return { hashes: {}, strings: {} };
    return JSON.parse(readFileSync(this.file, 'utf8'));
  }
  write(data) {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify(data, null, 2));
  }
  async hgetall(key) { return this.read().hashes[key] || {}; }
  async hset(key, field, value) {
    const d = this.read();
    (d.hashes[key] ||= {})[field] = value;
    this.write(d);
    return 1;
  }
  async hdel(key, field) {
    const d = this.read();
    const had = d.hashes[key] && field in d.hashes[key];
    if (had) { delete d.hashes[key][field]; this.write(d); }
    return had ? 1 : 0;
  }
  async setnx(key, value) {
    const d = this.read();
    if (key in d.strings) return false;
    d.strings[key] = value;
    this.write(d);
    return true;
  }
  async del(key) {
    const d = this.read();
    delete d.strings[key];
    delete d.hashes[key];
    this.write(d);
    this.counters.delete(key);
    return 1;
  }
  async peek(key) {
    const cur = this.counters.get(key);
    return cur && cur.expires > Date.now() ? cur.n : 0;
  }
  async incr(key, ttlSeconds) {
    const now = Date.now();
    const cur = this.counters.get(key);
    if (!cur || cur.expires < now) {
      this.counters.set(key, { n: 1, expires: now + ttlSeconds * 1000 });
      return 1;
    }
    cur.n += 1;
    return cur.n;
  }
}

let instance, instanceKey;
export function getStore() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const file = resolve(process.env.VIRELO_DEV_STORE || '.data/dev-store.json');
  const key = `${url}|${token}|${file}`;
  if (instance && instanceKey === key) return instance;
  if (url && token) {
    instance = new UpstashStore(url.replace(/\/$/, ''), token);
  } else if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new StoreError('Storage is not configured (set the Upstash Redis REST variables).');
  } else {
    instance = new FileStore(file); // local development only
  }
  instanceKey = key;
  return instance;
}

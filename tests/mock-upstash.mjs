// Tiny in-memory implementation of the Upstash Redis REST protocol (POST a JSON command array,
// receive {"result": …}). Used only by the tests to exercise the production storage adapter.
import http from 'node:http';

export function startMockUpstash(token = 'test-token') {
  const hashes = new Map(), strings = new Map();
  const server = http.createServer(async (req, res) => {
    const send = (code, body) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
    if (req.headers.authorization !== `Bearer ${token}`) return send(401, { error: 'Unauthorized' });
    let raw = '';
    for await (const c of req) raw += c;
    const [cmd, key, ...args] = JSON.parse(raw);
    switch (String(cmd).toUpperCase()) {
      case 'HSET': { const h = hashes.get(key) || new Map(); const isNew = !h.has(args[0]); h.set(args[0], args[1]); hashes.set(key, h); return send(200, { result: isNew ? 1 : 0 }); }
      case 'HGETALL': return send(200, { result: [...(hashes.get(key) || new Map())].flat() });
      case 'HDEL': { const h = hashes.get(key); return send(200, { result: h && h.delete(args[0]) ? 1 : 0 }); }
      case 'SET': { if (args.includes('NX') && strings.has(key)) return send(200, { result: null }); strings.set(key, args[0]); return send(200, { result: 'OK' }); }
      case 'GET': return send(200, { result: strings.has(key) ? String(strings.get(key)) : null });
      case 'DEL': { const had = strings.delete(key) || hashes.delete(key); return send(200, { result: had ? 1 : 0 }); }
      case 'INCR': { const n = Number(strings.get(key) || 0) + 1; strings.set(key, n); return send(200, { result: n }); }
      case 'EXPIRE': return send(200, { result: 1 });
      default: return send(400, { error: `ERR unknown command ${cmd}` });
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve({
    url: `http://127.0.0.1:${server.address().port}`, token, close: () => server.close(), strings, hashes
  })));
}

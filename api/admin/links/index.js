// ADMIN: list all links (including disabled) and create a link. Every request is authorized server-side.
import { json, methodNotAllowed, readJson, sameOrigin, safe } from '../../../lib/http.js';
import { requireAdmin } from '../../../lib/auth.js';
import { listLinks, createLink } from '../../../lib/links-repo.js';

export default safe(async (req, res) => {
  if (!['GET', 'POST'].includes(req.method)) return methodNotAllowed(res, ['GET', 'POST']);
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') return json(res, 200, { links: await listLinks() });

  if (!sameOrigin(req)) return json(res, 403, { error: 'forbidden' });
  const result = await createLink(await readJson(req));
  if (!result.ok) return json(res, 422, { error: 'validation', errors: result.errors });
  json(res, 201, { link: result.link });
});

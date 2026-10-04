// ADMIN: update (PATCH/PUT, partial allowed) or delete one link.
import { json, methodNotAllowed, readJson, sameOrigin, routeId, safe } from '../../../lib/http.js';
import { requireAdmin } from '../../../lib/auth.js';
import { updateLink, deleteLink } from '../../../lib/links-repo.js';

export default safe(async (req, res) => {
  if (!['PATCH', 'PUT', 'DELETE'].includes(req.method)) return methodNotAllowed(res, ['PATCH', 'PUT', 'DELETE']);
  if (!requireAdmin(req, res)) return;
  if (!sameOrigin(req)) return json(res, 403, { error: 'forbidden' });
  const id = routeId(req);

  if (req.method === 'DELETE') {
    return (await deleteLink(id)) ? json(res, 200, { ok: true }) : json(res, 404, { error: 'not_found' });
  }
  const result = await updateLink(id, await readJson(req));
  if (result.notFound) return json(res, 404, { error: 'not_found' });
  if (!result.ok) return json(res, 422, { error: 'validation', errors: result.errors });
  json(res, 200, { link: result.link });
});

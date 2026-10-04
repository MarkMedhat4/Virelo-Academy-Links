// PUBLIC: enabled links only, sorted by `order` ASC. Read-only.
import { json, methodNotAllowed, safe } from '../lib/http.js';
import { listPublicLinks } from '../lib/links-repo.js';

export default safe(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const links = await listPublicLinks();
  // Browsers always revalidate, so a disabled link never lingers in a visitor's cache.
  // Vercel's CDN may serve a copy for a few seconds to protect the database.
  res.setHeader('Vercel-CDN-Cache-Control', 'max-age=15, stale-while-revalidate=60');
  json(res, 200, { links }, { cache: 'public, max-age=0, must-revalidate' });
});

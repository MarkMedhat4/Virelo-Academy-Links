import { json, methodNotAllowed, safe } from '../../lib/http.js';
import { getSession } from '../../lib/auth.js';

export default safe(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const user = getSession(req);
  if (!user) return json(res, 401, { error: 'unauthorized' });
  json(res, 200, { user });
});

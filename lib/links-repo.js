// Data access for links. Storage layout: one Redis hash `virelo:links` (field = link id, value = JSON).
import { randomUUID } from 'node:crypto';
import { getStore } from './store.js';
import { buildSeedLinks } from './seed-links.js';
import { validateLink } from '../public/js/link-schema.js';

export const KEY_LINKS = 'virelo:links';
export const KEY_SEEDED = 'virelo:links:seeded';

export const byOrder = (a, b) =>
  a.order - b.order || String(a.createdAt).localeCompare(String(b.createdAt)) || a.id.localeCompare(b.id);

async function ensureSeeded(store) {
  // SET NX makes seeding happen exactly once, even with concurrent first requests.
  if (!(await store.setnx(KEY_SEEDED, new Date().toISOString()))) return;
  try {
    for (const link of buildSeedLinks()) await store.hset(KEY_LINKS, link.id, JSON.stringify(link));
  } catch (err) {
    await store.del(KEY_SEEDED).catch(() => {});
    throw err;
  }
}

export async function listLinks() {
  const store = getStore();
  await ensureSeeded(store);
  const raw = await store.hgetall(KEY_LINKS);
  const links = [];
  for (const value of Object.values(raw)) {
    try { links.push(typeof value === 'string' ? JSON.parse(value) : value); } catch { /* skip corrupt entry */ }
  }
  return links.sort(byOrder);
}

export async function listPublicLinks() {
  return (await listLinks())
    .filter((l) => l.enabled)
    .map(({ id, title, description, url, icon, category, featured, order, translations }) =>
      ({ id, title, description, url, icon, category, featured, order, translations: translations || {} }));
}

// Re-use the existing spelling of a category ("social" → "Social") so categories never duplicate by case.
function canonicalCategory(category, links) {
  const hit = links.find((l) => l.category.toLowerCase() === category.toLowerCase());
  return hit ? hit.category : category;
}

export async function createLink(input) {
  const { ok, errors, value } = validateLink(input);
  if (!ok) return { ok, errors };
  const links = await listLinks();
  const now = new Date().toISOString();
  const link = {
    id: randomUUID(),
    ...value,
    category: canonicalCategory(value.category, links),
    order: value.order ?? (links.reduce((m, l) => Math.max(m, l.order), 0) + 1),
    translations: value.translations || {},
    createdAt: now,
    updatedAt: now
  };
  await getStore().hset(KEY_LINKS, link.id, JSON.stringify(link));
  return { ok: true, link };
}

export async function updateLink(id, input) {
  const links = await listLinks();
  const existing = links.find((l) => l.id === id);
  if (!existing) return { ok: false, notFound: true };
  const { ok, errors, value } = validateLink(input, { partial: true });
  if (!ok) return { ok, errors };
  const link = { ...existing, ...value, id: existing.id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
  if (value.category) link.category = canonicalCategory(value.category, links.filter((l) => l.id !== id));
  await getStore().hset(KEY_LINKS, id, JSON.stringify(link));
  return { ok: true, link };
}

export async function deleteLink(id) {
  const store = getStore();
  await ensureSeeded(store);
  return (await store.hdel(KEY_LINKS, id)) > 0;
}

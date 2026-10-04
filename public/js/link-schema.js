// Link model + validation. Used by the admin form (instant feedback) AND by the API (authoritative).
// Errors are returned as machine codes; the UI localizes them.
import { ICON_NAMES } from './icons.js';

export const LIMITS = { title: 80, description: 240, url: 2048, category: 40, orderMax: 9999 };
export const DEFAULT_CATEGORIES = ['Platform', 'Registration', 'Payment', 'Education', 'Social', 'Community', 'Contact', 'Other'];
export const LANGS = ['en', 'ar'];

const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

function checkUrl(value) {
  try {
    const u = new URL(value);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    if (u.username || u.password) return false;
    return Boolean(u.hostname);
  } catch {
    return false;
  }
}

/**
 * @param {object} raw     user input
 * @param {{partial?: boolean}} opts  partial = only validate keys that are present (for PATCH)
 * @returns {{ok: boolean, errors: Record<string,string>, value: object}}
 */
export function validateLink(raw, { partial = false } = {}) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const has = (k) => Object.prototype.hasOwnProperty.call(input, k);
  const errors = {};
  const value = {};

  if (!partial || has('title')) {
    const v = clean(input.title);
    if (!v) errors.title = 'required';
    else if (v.length > LIMITS.title) errors.title = 'too_long';
    else value.title = v;
  }
  if (!partial || has('description')) {
    const v = clean(input.description);
    if (v.length > LIMITS.description) errors.description = 'too_long';
    else value.description = v;
  }
  if (!partial || has('url')) {
    const v = String(input.url ?? '').trim();
    if (!v) errors.url = 'required';
    else if (v.length > LIMITS.url || !checkUrl(v)) errors.url = 'invalid_url';
    else value.url = v; // stored exactly as entered (no normalization)
  }
  if (!partial || has('icon')) {
    const v = String(input.icon ?? '').trim();
    if (!ICON_NAMES.includes(v)) errors.icon = 'invalid_icon';
    else value.icon = v;
  }
  if (!partial || has('category')) {
    const v = clean(input.category);
    if (!v) errors.category = 'required';
    else if (v.length > LIMITS.category) errors.category = 'too_long';
    else value.category = v;
  }
  for (const key of ['featured', 'enabled']) {
    if (!partial || has(key)) {
      if (typeof input[key] === 'boolean') value[key] = input[key];
      else errors[key] = 'invalid_boolean';
    }
  }
  if (has('order')) {
    const r = input.order;
    if (r === '' || r === null || r === undefined) {
      // On create an empty order means "append at the end"; on update it is not allowed.
      if (partial) errors.order = 'not_number';
    } else {
      const n = typeof r === 'number' ? r : Number(String(r).trim());
      if (!Number.isInteger(n)) errors.order = 'not_number';
      else if (n < 0 || n > LIMITS.orderMax) errors.order = 'out_of_range';
      else value.order = n;
    }
  }
  if (has('translations')) {
    const t = input.translations && typeof input.translations === 'object' ? input.translations : {};
    const out = {};
    for (const lang of LANGS) {
      const src = t[lang] && typeof t[lang] === 'object' ? t[lang] : {};
      const title = clean(src.title);
      const description = clean(src.description);
      if (title.length > LIMITS.title) errors[`translations.${lang}.title`] = 'too_long';
      if (description.length > LIMITS.description) errors[`translations.${lang}.description`] = 'too_long';
      if (title || description) out[lang] = { ...(title && { title }), ...(description && { description }) };
    }
    value.translations = out;
  }
  return { ok: Object.keys(errors).length === 0, errors, value };
}

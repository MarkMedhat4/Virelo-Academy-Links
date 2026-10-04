/* ==========================================================================
   Virelo Links — public page · script.js (ES module)
   Renders the link hub from /api/links (enabled links, sorted by `order`),
   plus the EN/AR switch, Share and Scan (QR). Link text is inserted with
   textContent only, so admin-entered content can never inject markup.
   QR generation uses js/vendor/qrcode.min.js (qrcode-generator, MIT).
   ========================================================================== */
import { createIcon, isSocialIcon } from './icons.js';

const DEFAULT_LANG = 'en';
const STORAGE_KEY = 'virelo-lang';
const TOAST_MS = 2200;
const DIRECTION = { en: 'ltr', ar: 'rtl' };
const ARABIC = /[\u0600-\u06FF]/;

/* ---------- UI translations (link titles/descriptions come from the database) ---------- */
const TRANSLATIONS = {
  en: {
    tag1: "WE DON'T COMPETE ON QUALITY.", tag2: 'WE LEAD IT.',
    desc: 'Premium Education • Programming • Computer Science • Future Skills',
    share: 'Share', scan: 'Scan', scanT: 'Scan to open', close: 'Close', feat: 'Featured',
    ok: 'Link copied successfully.', copyFail: "Couldn't copy the link. Please copy it from the address bar.",
    skip: 'Skip to main content', langGroup: 'Language', langEn: 'English', langAr: 'Arabic',
    socialNav: 'Social media', linksNav: 'Official links', newTab: '(opens in a new tab)',
    qrLabel: 'QR code for this page', qrError: 'QR unavailable',
    retry: 'Try again', loadError: 'Links are temporarily unavailable. Please try again.',
    empty: 'No links are available right now.'
  },
  ar: {
    tag1: 'لا ننافس على الجودة.', tag2: 'نقودها.',
    desc: 'تعليم متميز • برمجة • علوم الحاسب • مهارات المستقبل',
    share: 'مشاركة', scan: 'مسح', scanT: 'امسح للفتح', close: 'إغلاق', feat: 'مميز',
    ok: 'تم نسخ الرابط بنجاح.', copyFail: 'تعذّر نسخ الرابط. يرجى نسخه من شريط العنوان.',
    skip: 'انتقل إلى المحتوى الرئيسي', langGroup: 'اللغة', langEn: 'الإنجليزية', langAr: 'العربية',
    socialNav: 'وسائل التواصل الاجتماعي', linksNav: 'الروابط الرسمية', newTab: '(يفتح في علامة تبويب جديدة)',
    qrLabel: 'رمز QR لهذه الصفحة', qrError: 'رمز QR غير متاح',
    retry: 'حاول مرة أخرى', loadError: 'الروابط غير متاحة مؤقتًا. يرجى المحاولة مرة أخرى.',
    empty: 'لا توجد روابط متاحة حاليًا.'
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const state = { lang: DEFAULT_LANG, links: null, status: 'loading' }; // status: loading | ready | empty | error

const t = (key) => TRANSLATIONS[state.lang][key] ?? TRANSLATIONS[DEFAULT_LANG][key] ?? '';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const readStoredLang = () => {
  try { const v = sessionStorage.getItem(STORAGE_KEY); return v in TRANSLATIONS ? v : DEFAULT_LANG; }
  catch { return DEFAULT_LANG; }
};
const storeLang = (lang) => { try { sessionStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ } };

/* ---------- Links: localize + render ---------- */
function localize(link) {
  const tr = (link.translations && link.translations[state.lang]) || {};
  return { title: tr.title || link.title, description: tr.description || link.description || '' };
}

function textLang(text) { return ARABIC.test(text) ? 'ar' : 'en'; }

function buildSocial(link) {
  const { title } = localize(link);
  const li = el('li');
  const a = el('a', 'social__link');
  a.href = link.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  a.setAttribute('aria-label', title);
  a.dataset.id = link.id; a.dataset.category = link.category; a.dataset.title = link.translations?.en?.title || link.title;
  a.appendChild(createIcon(link.icon, 'icon'));
  li.appendChild(a);
  return li;
}

function buildCard(link) {
  const { title, description } = localize(link);
  const li = el('li');
  const a = el('a', `card${link.featured ? ' card--featured' : ''}`);
  a.href = link.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  a.dataset.id = link.id; a.dataset.category = link.category; a.dataset.title = link.translations?.en?.title || link.title;
  // The card follows the direction of the text it displays (Arabic content → RTL), regardless of page language.
  a.dir = ARABIC.test(title) ? 'rtl' : 'ltr';

  const tile = el('span', 'card__icon');
  tile.appendChild(createIcon(link.icon, 'icon icon--lg'));

  const body = el('span', 'card__body');
  const titleRow = el('span', 'card__title');
  const titleText = el('span', null, title);
  titleText.lang = textLang(title);
  titleRow.appendChild(titleText);
  if (link.featured) titleRow.appendChild(el('span', 'badge', t('feat')));
  body.appendChild(titleRow);
  if (description) {
    const desc = el('span', 'card__desc', description);
    desc.lang = textLang(description); desc.dir = 'auto';
    body.appendChild(desc);
  }
  body.appendChild(el('span', 'sr-only', t('newTab')));

  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrow.setAttribute('class', 'icon card__arrow');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.setAttribute('focusable', 'false');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#i-arrow');
  arrow.appendChild(use);

  a.append(tile, body, arrow);
  li.appendChild(a);
  return li;
}

function skeletonCard() {
  const li = el('li', 'card card--skeleton');
  li.setAttribute('aria-hidden', 'true');
  const body = el('span', 'skeleton-body');
  body.append(el('span', 'skeleton skeleton--line'), el('span', 'skeleton skeleton--line skeleton--short'));
  li.append(el('span', 'skeleton skeleton--icon'), body);
  return li;
}

function renderLinks() {
  const list = $('#link-list');
  const socialNav = $('.social-nav');
  const stateBox = $('#links-state');
  const stateText = $('#links-state-text');
  const retry = $('#links-retry');

  if (state.status === 'loading') {
    stateBox.hidden = true;
    return; // skeleton from the HTML stays visible
  }
  list.setAttribute('aria-busy', 'false');

  if (state.status === 'ready') {
    const links = [...state.links].sort((a, b) => a.order - b.order);
    list.replaceChildren(...links.map(buildCard));
    const social = links.filter((l) => isSocialIcon(l.icon));
    $('#social-list').replaceChildren(...social.map(buildSocial));
    socialNav.hidden = social.length === 0;
    stateBox.hidden = true;
    return;
  }
  // empty or error → Virelo mark + short explanation (+ retry on error)
  list.replaceChildren();
  socialNav.hidden = true;
  stateText.textContent = t(state.status === 'error' ? 'loadError' : 'empty');
  retry.hidden = state.status !== 'error';
  stateBox.hidden = false;
}

async function loadLinks() {
  state.status = 'loading';
  $('#link-list').setAttribute('aria-busy', 'true');
  try {
    const res = await fetch('/api/links', { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.links = Array.isArray(data.links) ? data.links : [];
    state.status = state.links.length ? 'ready' : 'empty';
  } catch {
    state.status = 'error';
  }
  renderLinks();
}

/* ---------- Language ---------- */
function applyTranslations() {
  $$('[data-i18n]').forEach((node) => { const v = t(node.dataset.i18n); if (v) node.textContent = v; });
  $$('[data-i18n-aria]').forEach((node) => { const v = t(node.dataset.i18nAria); if (v) node.setAttribute('aria-label', v); });
}

function setLang(lang) {
  if (!(lang in TRANSLATIONS)) lang = DEFAULT_LANG;
  state.lang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = DIRECTION[lang];
  $$('.lang__btn').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang)));
  applyTranslations();
  if (state.status !== 'loading') renderLinks();
  const qr = $('#qr-code');
  if (qr && qr.getAttribute('role') === 'img') qr.setAttribute('aria-label', t('qrLabel'));
  storeLang(lang);
}

/* ---------- Click tracking hook ----------
   document.addEventListener('link-click', (e) => send(e.detail));
   detail = { id, title, category, timestamp } */
function track(anchor) {
  document.dispatchEvent(new CustomEvent('link-click', {
    detail: { id: anchor.dataset.id, title: anchor.dataset.title, category: anchor.dataset.category, timestamp: new Date().toISOString() }
  }));
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-visible'), TOAST_MS);
}

/* ---------- Share ---------- */
function legacyCopy(text) {
  const input = document.createElement('input');
  input.value = text; input.setAttribute('readonly', ''); input.className = 'sr-only';
  document.body.appendChild(input); input.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* ignored */ }
  input.remove();
  return copied;
}
async function copyLink(url) {
  try { await navigator.clipboard.writeText(url); return true; } catch { return legacyCopy(url); }
}
async function shareSite() {
  const url = location.href;
  if (navigator.share) {
    try { await navigator.share({ title: document.title, url }); return; }
    catch (err) { if (err && err.name === 'AbortError') return; }
  }
  toast((await copyLink(url)) ? t('ok') : t('copyFail'));
}

/* ---------- Scan (QR code for this page) ---------- */
function renderQr() {
  const box = $('#qr-code');
  try {
    if (typeof qrcode !== 'function') throw new Error('QR library not loaded'); // eslint-disable-line no-undef
    const qr = qrcode(0, 'M'); // eslint-disable-line no-undef
    qr.addData(location.href);
    qr.make();
    box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', t('qrLabel'));
  } catch {
    box.textContent = t('qrError');
    box.removeAttribute('role'); box.removeAttribute('aria-label');
  }
}
function openQrDialog() {
  const dialog = $('#qr-dialog');
  renderQr();
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
}
function closeQrDialog() {
  const dialog = $('#qr-dialog');
  if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
}

/* ---------- Init ---------- */
function init() {
  $$('.lang__btn').forEach((btn) => btn.addEventListener('click', () => setLang(btn.dataset.lang)));
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[data-id]');
    if (anchor) track(anchor);
  });
  $('#share-btn').addEventListener('click', shareSite);
  $('#scan-btn').addEventListener('click', openQrDialog);
  $('#qr-close').addEventListener('click', closeQrDialog);
  $('#links-retry').addEventListener('click', () => {
    $('#links-state').hidden = true;
    $('#link-list').replaceChildren(...Array.from({ length: 3 }, skeletonCard));
    loadLinks();
  });
  $('#qr-dialog').addEventListener('click', (event) => {
    const dialog = event.currentTarget;
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    const outside = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
    if (outside) closeQrDialog();
  });
  $('#year').textContent = new Date().getFullYear();
  setLang(readStoredLang());
  loadLinks();
}

init();

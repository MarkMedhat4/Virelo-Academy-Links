// Virelo Links — admin dashboard. All data comes from the protected /api/admin/* endpoints; the server
// re-validates and re-authorizes every request, so nothing here is trusted. Text is set via textContent only.
import { createIcon, ICONS, ICON_NAMES } from './icons.js';
import { validateLink, DEFAULT_CATEGORIES } from './link-schema.js';
import { t, errorText, setLang, applyI18n } from './admin-i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const state = { links: [], status: 'loading', editingId: null, deleting: null };

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

/* ---------- API ---------- */
async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) {
    toast(t('sessionExpired'), 'error');
    setTimeout(() => location.replace('/admin'), 600);
    throw Object.assign(new Error('unauthorized'), { handled: true });
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(message, kind = 'success') {
  const node = $('#toast');
  node.textContent = message;
  node.classList.toggle('toast--error', kind === 'error');
  node.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-visible'), 3200);
}

const setBusy = (btnId, spinnerId, labelId, busy, busyKey, idleKey) => {
  $(btnId).disabled = busy;
  $(spinnerId).hidden = !busy;
  const label = $(labelId);
  label.dataset.i18n = busy ? busyKey : idleKey;
  label.textContent = t(busy ? busyKey : idleKey);
};

/* ---------- Load + render ---------- */
async function loadLinks() {
  state.status = 'loading';
  render();
  try {
    const { ok, data } = await api('/api/admin/links');
    if (!ok) throw new Error('load failed');
    state.links = data.links;
    state.status = state.links.length ? 'ready' : 'empty';
  } catch (err) {
    if (err.handled) return;
    state.status = 'error';
  }
  render();
}

function render() {
  renderKpis();
  const loading = $('#panel-loading'), table = $('#links-table'), box = $('#panel-state');
  loading.hidden = state.status !== 'loading';
  table.hidden = state.status !== 'ready';
  box.hidden = state.status === 'loading' || state.status === 'ready';
  if (state.status === 'ready') renderRows();
  if (!box.hidden) renderPanelState(box);
}

function renderKpis() {
  const links = state.links;
  const known = state.status === 'ready' || state.status === 'empty';
  const v = (n) => (known ? String(n) : '–');
  $('#kpi-total').textContent = v(links.length);
  $('#kpi-active').textContent = v(links.filter((l) => l.enabled).length);
  $('#kpi-featured').textContent = v(links.filter((l) => l.featured).length);
  $('#kpi-categories').textContent = v(new Set(links.map((l) => l.category.toLowerCase())).size);
}

function renderPanelState(box) {
  box.replaceChildren();
  const mark = el('img', 'panel-state__mark');
  mark.src = '/assets/logo/virelo-logo.png'; mark.alt = ''; mark.width = 72; mark.height = 72;
  box.appendChild(mark);
  if (state.status === 'error') {
    box.append(el('p', 'panel-state__text', t('loadError')));
    const retry = el('button', 'btn btn--light', t('retry'));
    retry.type = 'button';
    retry.addEventListener('click', loadLinks);
    box.appendChild(retry);
  } else {
    box.append(el('h3', 'panel-state__title', t('emptyTitle')), el('p', 'panel-state__text', t('emptyText')));
    const add = el('button', 'btn btn--primary', t('addLink'));
    add.type = 'button';
    add.addEventListener('click', () => openForm());
    box.appendChild(add);
  }
}

function pill(text, kind) { return el('span', `pill pill--${kind}`, text); }

function actionButton(label, className, onClick) {
  const b = el('button', `btn btn--sm ${className}`, label);
  b.type = 'button';
  b.addEventListener('click', () => onClick(b));
  return b;
}

function renderRows() {
  const rows = state.links.map((link) => {
    const tr = el('tr', link.enabled ? '' : 'is-disabled');

    const tdLink = el('td', 'cell-link');
    tdLink.dataset.label = t('colLink');
    const wrap = el('div', 'link-cell');
    const tile = el('span', 'link-cell__icon');
    tile.title = ICONS[link.icon]?.label || link.icon;
    tile.appendChild(createIcon(link.icon, 'icon'));
    const text = el('div', 'link-cell__text');
    const title = el('p', 'link-cell__title', link.title); title.dir = 'auto';
    text.appendChild(title);
    if (link.description) { const d = el('p', 'link-cell__desc', link.description); d.dir = 'auto'; text.appendChild(d); }
    wrap.append(tile, text);
    tdLink.appendChild(wrap);

    const tdCat = el('td'); tdCat.dataset.label = t('colCategory');
    const cat = pill(link.category, 'cat'); cat.dir = 'auto'; tdCat.appendChild(cat);

    const tdStatus = el('td'); tdStatus.dataset.label = t('colStatus');
    const badges = el('div', 'badges');
    if (link.featured) badges.appendChild(pill(t('featured'), 'gold'));
    const st = pill(link.enabled ? t('enabled') : t('disabled'), link.enabled ? 'ok' : 'off');
    if (!link.enabled) st.title = t('hiddenPublicly');
    badges.appendChild(st);
    tdStatus.appendChild(badges);

    const tdOrder = el('td', 'cell-order', String(link.order)); tdOrder.dataset.label = t('colOrder');

    const tdActions = el('td', 'cell-actions'); tdActions.dataset.label = t('colActions');
    const actions = el('div', 'actions');
    actions.append(
      actionButton(t('edit'), 'btn--light', () => openForm(link)),
      actionButton(link.enabled ? t('disable') : t('enable'), 'btn--light', (b) => toggleEnabled(link, b)),
      actionButton(t('delete'), 'btn--danger', () => askDelete(link))
    );
    tdActions.appendChild(actions);

    tr.append(tdLink, tdCat, tdStatus, tdOrder, tdActions);
    return tr;
  });
  $('#rows').replaceChildren(...rows);
}

/* ---------- Enable / disable ---------- */
async function toggleEnabled(link, button) {
  button.disabled = true;
  try {
    const { ok, status } = await api(`/api/admin/links/${encodeURIComponent(link.id)}`, { method: 'PATCH', body: { enabled: !link.enabled } });
    if (!ok) { toast(t(status === 404 ? 'notFound' : 'updateError'), 'error'); }
    else toast(t(link.enabled ? 'disabledDone' : 'enabledDone'));
    await loadLinks();
  } catch (err) {
    if (!err.handled) { toast(t('updateError'), 'error'); button.disabled = false; }
  }
}

/* ---------- Add / edit form ---------- */
const form = $('#link-form');
const dialog = $('#link-dialog');

function buildIconGrid() {
  const grid = $('#icon-grid');
  grid.replaceChildren(...ICON_NAMES.map((name) => {
    const label = el('label', 'icon-opt');
    const input = el('input');
    input.type = 'radio'; input.name = 'icon'; input.value = name;
    const tile = el('span', 'icon-opt__tile');
    tile.append(createIcon(name, 'icon'), el('span', 'icon-opt__name', ICONS[name].label));
    label.append(input, tile);
    return label;
  }));
}

function refreshCategories() {
  const seen = new Map();
  for (const c of [...DEFAULT_CATEGORIES, ...state.links.map((l) => l.category)]) {
    if (!seen.has(c.toLowerCase())) seen.set(c.toLowerCase(), c);
  }
  $('#category-list').replaceChildren(...[...seen.values()].map((c) => { const o = el('option'); o.value = c; return o; }));
}

const radioValue = (name) => form.elements[name].value === 'true';

function clearErrors() {
  $$('[data-error-for]', form).forEach((n) => { n.hidden = true; n.textContent = ''; });
  $$('[aria-invalid]', form).forEach((n) => n.removeAttribute('aria-invalid'));
  $('#form-status').hidden = true;
}

function showErrors(errors) {
  let first;
  for (const [field, code] of Object.entries(errors)) {
    const key = field.startsWith('translations.') ? null : field;
    const target = key && $(`[data-error-for="${key}"]`, form);
    if (target) {
      target.textContent = errorText(code);
      target.hidden = false;
      const input = form.elements[key];
      if (input && input.setAttribute) input.setAttribute('aria-invalid', 'true');
      first ??= input && input.focus ? input : null;
    } else {
      const status = $('#form-status');
      status.textContent = t('formErrors');
      status.hidden = false;
    }
  }
  if (first) first.focus();
}

function openForm(link) {
  state.editingId = link ? link.id : null;
  clearErrors();
  form.reset();
  refreshCategories();
  $('#form-title').dataset.i18n = link ? 'formEditTitle' : 'formAddTitle';
  $('#form-title').textContent = t(link ? 'formEditTitle' : 'formAddTitle');
  const tr = (link && link.translations) || {};
  const values = link || { title: '', description: '', url: '', icon: '', category: '', featured: false, enabled: true, order: state.links.reduce((m, l) => Math.max(m, l.order), 0) + 1 };
  form.elements.title.value = values.title;
  form.elements.description.value = values.description || '';
  form.elements.url.value = values.url;
  form.elements.category.value = values.category;
  form.elements.order.value = values.order;
  form.elements.featured.value = String(values.featured);
  form.elements.enabled.value = String(values.enabled);
  const iconInput = $(`input[name="icon"][value="${CSS.escape(values.icon || '')}"]`, form);
  if (iconInput) iconInput.checked = true;
  $('#t-en-title').value = tr.en?.title || ''; $('#t-en-desc').value = tr.en?.description || '';
  $('#t-ar-title').value = tr.ar?.title || ''; $('#t-ar-desc').value = tr.ar?.description || '';
  $('.translations').open = Boolean(tr.en || tr.ar);
  dialog.showModal();
  form.elements.title.focus();
}

function readForm() {
  const iconInput = $('input[name="icon"]:checked', form);
  return {
    title: form.elements.title.value,
    description: form.elements.description.value,
    url: form.elements.url.value,
    icon: iconInput ? iconInput.value : '',
    category: form.elements.category.value,
    featured: radioValue('featured'),
    enabled: radioValue('enabled'),
    order: form.elements.order.value,
    translations: {
      en: { title: $('#t-en-title').value, description: $('#t-en-desc').value },
      ar: { title: $('#t-ar-title').value, description: $('#t-ar-desc').value }
    }
  };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors();
  const input = readForm();
  const check = validateLink(input);
  if (state.editingId && String(input.order).trim() === '') check.errors.order = 'not_number';
  if (!check.ok || check.errors.order) return showErrors({ ...check.errors });

  const editing = Boolean(state.editingId);
  setBusy('#save-btn', '#save-spinner', '#save-label', true, 'saving', 'save');
  try {
    const { ok, status, data } = await api(editing ? `/api/admin/links/${encodeURIComponent(state.editingId)}` : '/api/admin/links', {
      method: editing ? 'PATCH' : 'POST', body: input
    });
    if (ok) {
      dialog.close();
      toast(t(editing ? 'updated' : 'added'));
      await loadLinks();
    } else if (status === 422 && data.errors) {
      showErrors(data.errors);
    } else if (status === 404) {
      dialog.close(); toast(t('notFound'), 'error'); await loadLinks();
    } else {
      const s = $('#form-status'); s.textContent = t('saveError'); s.hidden = false;
    }
  } catch (err) {
    if (!err.handled) { const s = $('#form-status'); s.textContent = t('saveError'); s.hidden = false; }
  }
  setBusy('#save-btn', '#save-spinner', '#save-label', false, 'saving', 'save');
});

$$('[data-close]', dialog).forEach((b) => b.addEventListener('click', () => dialog.close()));

/* ---------- Delete (with confirmation) ---------- */
const confirmDialog = $('#confirm-dialog');
function askDelete(link) {
  state.deleting = link;
  $('#confirm-name').textContent = link.title;
  confirmDialog.showModal();
  $('#confirm-cancel').focus();
}
$('#confirm-cancel').addEventListener('click', () => confirmDialog.close());
$('#confirm-ok').addEventListener('click', async () => {
  const link = state.deleting;
  if (!link) return;
  setBusy('#confirm-ok', '#confirm-spinner', '#confirm-label', true, 'deleting', 'delete');
  try {
    const { ok, status } = await api(`/api/admin/links/${encodeURIComponent(link.id)}`, { method: 'DELETE' });
    confirmDialog.close();
    if (ok) toast(t('deleted'));
    else toast(t(status === 404 ? 'notFound' : 'deleteError'), 'error');
    await loadLinks();
  } catch (err) {
    if (!err.handled) { confirmDialog.close(); toast(t('deleteError'), 'error'); }
  }
  setBusy('#confirm-ok', '#confirm-spinner', '#confirm-label', false, 'deleting', 'delete');
});
for (const d of [dialog, confirmDialog]) {
  d.addEventListener('click', (e) => { // click on the dimmed backdrop closes the dialog
    if (e.target !== d) return;
    const r = d.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
  });
}

/* ---------- Session, logout, language ---------- */
$('#logout-btn').addEventListener('click', async (e) => {
  e.currentTarget.disabled = true;
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
    location.replace('/admin');
  } catch {
    toast(t('logoutError'), 'error');
    e.currentTarget.disabled = false;
  }
});
$$('.lang__btn').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
$('#add-btn').addEventListener('click', () => openForm());

document.addEventListener('admin-lang-change', () => {
  $$('[data-i18n-placeholder]').forEach((n) => n.setAttribute('placeholder', t(n.dataset.i18nPlaceholder)));
  if (dialog.open) $('#form-title').textContent = t(state.editingId ? 'formEditTitle' : 'formAddTitle');
  render();
});

async function init() {
  buildIconGrid();
  applyI18n();
  api('/api/admin/session').then(({ ok, data }) => {
    if (ok) { $('#user-name').textContent = data.user.name; $('#user-chip').hidden = false; }
  }).catch(() => {});
  loadLinks();
}
init();

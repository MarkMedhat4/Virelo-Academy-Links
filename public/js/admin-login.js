import { t, setLang, applyI18n } from './admin-i18n.js';

const $ = (s) => document.querySelector(s);
const form = $('#login-form'), status = $('#login-status'), btn = $('#login-btn');
let redirecting = false;

applyI18n();
document.querySelectorAll('.lang__btn').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

// Already signed in? Skip the form.
fetch('/api/admin/session').then((r) => { if (r.ok) location.replace('/admin/dashboard'); }).catch(() => {});

$('#toggle-pw').addEventListener('click', (e) => {
  const input = $('#password');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  e.currentTarget.setAttribute('aria-pressed', String(show));
  e.currentTarget.setAttribute('aria-label', t(show ? 'hidePw' : 'showPw'));
  e.currentTarget.dataset.i18nAria = show ? 'hidePw' : 'showPw';
  $('#eye-on').hidden = show;
  $('#eye-off').hidden = !show;
});

function setStatus(kind, text) {
  status.hidden = !text;
  status.textContent = text || '';
  status.className = `form-status${kind ? ` form-status--${kind}` : ''}`;
}
function setBusy(busy) {
  btn.disabled = busy;
  $('#login-spinner').hidden = !busy;
  $('#login-btn-label').textContent = t(busy ? 'loggingIn' : 'login');
  $('#login-btn-label').dataset.i18n = busy ? 'loggingIn' : 'login';
}
function fieldError(id, message) {
  const err = $(`#${id}-error`);
  err.hidden = !message;
  err.textContent = message || '';
  $(`#${id}`).setAttribute('aria-invalid', String(Boolean(message)));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (redirecting) return;
  const username = $('#username').value.trim();
  const password = $('#password').value;
  setStatus('', '');
  fieldError('username', username ? '' : t('fieldRequired'));
  fieldError('password', password ? '' : t('fieldRequired'));
  if (!username || !password) return (username ? $('#password') : $('#username')).focus();

  setBusy(true);
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      redirecting = true;
      setStatus('success', t('loginSuccess'));
      location.assign('/admin/dashboard');
      return;
    }
    setStatus('error', t(res.status === 429 ? 'loginTooMany' : res.status === 401 ? 'loginInvalid' : 'loginError'));
    if (res.status === 401) { $('#password').value = ''; $('#password').focus(); }
  } catch {
    setStatus('error', t('loginError'));
  }
  setBusy(false);
});

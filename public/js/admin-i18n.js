// Admin interface translations — English by default, Arabic optional. Choice is remembered in this browser.
const STRINGS = {
  en: {
    brand: 'Virelo Links', subtitle: 'Manage your official Virelo Academy links.',
    loginTitle: 'Admin Login', username: 'Username', password: 'Password', login: 'Login',
    loggingIn: 'Signing in…', loginSuccess: 'Signed in. Redirecting…',
    loginInvalid: 'Invalid username or password.', loginTooMany: 'Too many attempts. Please try again later.',
    loginError: 'Something went wrong. Please try again.', showPw: 'Show password', hidePw: 'Hide password',
    fieldRequired: 'This field is required.', langGroup: 'Language', langEn: 'English', langAr: 'Arabic',
    logout: 'Log out', signedInAs: 'Signed in as', logoutError: 'Unable to log out. Please try again.',
    totalLinks: 'Total Links', activeLinks: 'Active Links', featuredLinks: 'Featured Links', categories: 'Categories',
    links: 'Links', addLink: '+ Add Link', colLink: 'Link', colCategory: 'Category', colStatus: 'Status',
    colOrder: 'Order', colActions: 'Actions',
    featured: 'Featured', enabled: 'Enabled', disabled: 'Disabled', hiddenPublicly: 'Hidden from the public page',
    edit: 'Edit', delete: 'Delete', enable: 'Enable', disable: 'Disable', save: 'Save', cancel: 'Cancel', close: 'Close', retry: 'Retry',
    loading: 'Loading links…', loadError: 'Unable to load links. Please try again.',
    emptyTitle: 'No links yet', emptyText: 'Add your first link to publish it on the Virelo Links page.',
    formAddTitle: 'Add Link', formEditTitle: 'Edit Link',
    fTitle: 'Title', fDescription: 'Description', fUrl: 'URL', fIcon: 'Icon', fCategory: 'Category',
    fFeatured: 'Featured', fEnabled: 'Enabled', fOrder: 'Order', yes: 'Yes', no: 'No',
    orderHint: 'Lower numbers appear first on the public page.',
    categoryHint: 'Pick a suggestion or type a new category.',
    translations: 'Translations (optional)',
    translationsHint: 'Shown on the public page instead of the main text when the visitor uses that language.',
    tEn: 'English', tAr: 'Arabic', tTitle: 'Title', tDescription: 'Description',
    added: 'Link added successfully.', updated: 'Link updated successfully.', deleted: 'Link deleted successfully.',
    enabledDone: 'Link enabled.', disabledDone: 'Link disabled.',
    saveError: 'Unable to save the link. Please try again.', updateError: 'Unable to update the link. Please try again.',
    deleteError: 'Unable to delete the link. Please try again.', notFound: 'This link no longer exists. The list was refreshed.',
    saving: 'Saving…', deleting: 'Deleting…',
    confirmDelete: 'Are you sure you want to delete this link?', confirmDeleteNote: 'This cannot be undone.',
    sessionExpired: 'Your session has expired. Please log in again.',
    err_required: 'This field is required.', err_too_long: 'This is too long.',
    err_invalid_url: 'Enter a valid URL starting with http:// or https://.', err_invalid_icon: 'Choose an icon.',
    err_not_number: 'Enter a whole number.', err_out_of_range: 'Enter a number between 0 and 9999.',
    err_invalid_boolean: 'Choose Yes or No.', formErrors: 'Please fix the highlighted fields.'
  },
  ar: {
    brand: 'Virelo Links', subtitle: 'إدارة الروابط الرسمية لفيريلو أكاديمي.',
    loginTitle: 'تسجيل دخول المشرف', username: 'اسم المستخدم', password: 'كلمة المرور', login: 'تسجيل الدخول',
    loggingIn: 'جارٍ تسجيل الدخول…', loginSuccess: 'تم تسجيل الدخول. جارٍ التحويل…',
    loginInvalid: 'اسم المستخدم أو كلمة المرور غير صحيحة.', loginTooMany: 'محاولات كثيرة. يرجى المحاولة لاحقًا.',
    loginError: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.', showPw: 'إظهار كلمة المرور', hidePw: 'إخفاء كلمة المرور',
    fieldRequired: 'هذا الحقل مطلوب.', langGroup: 'اللغة', langEn: 'الإنجليزية', langAr: 'العربية',
    logout: 'تسجيل الخروج', signedInAs: 'مسجل الدخول باسم', logoutError: 'تعذّر تسجيل الخروج. يرجى المحاولة مرة أخرى.',
    totalLinks: 'إجمالي الروابط', activeLinks: 'الروابط النشطة', featuredLinks: 'الروابط المميزة', categories: 'التصنيفات',
    links: 'الروابط', addLink: '+ إضافة رابط', colLink: 'الرابط', colCategory: 'التصنيف', colStatus: 'الحالة',
    colOrder: 'الترتيب', colActions: 'الإجراءات',
    featured: 'مميز', enabled: 'مفعّل', disabled: 'معطّل', hiddenPublicly: 'مخفي عن الصفحة العامة',
    edit: 'تعديل', delete: 'حذف', enable: 'تفعيل', disable: 'تعطيل', save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق', retry: 'إعادة المحاولة',
    loading: 'جارٍ تحميل الروابط…', loadError: 'تعذّر تحميل الروابط. يرجى المحاولة مرة أخرى.',
    emptyTitle: 'لا توجد روابط بعد', emptyText: 'أضف أول رابط لنشره على صفحة Virelo Links.',
    formAddTitle: 'إضافة رابط', formEditTitle: 'تعديل الرابط',
    fTitle: 'العنوان', fDescription: 'الوصف', fUrl: 'الرابط (URL)', fIcon: 'الأيقونة', fCategory: 'التصنيف',
    fFeatured: 'مميز', fEnabled: 'مفعّل', fOrder: 'الترتيب', yes: 'نعم', no: 'لا',
    orderHint: 'الأرقام الأصغر تظهر أولًا في الصفحة العامة.',
    categoryHint: 'اختر اقتراحًا أو اكتب تصنيفًا جديدًا.',
    translations: 'الترجمات (اختياري)',
    translationsHint: 'تظهر في الصفحة العامة بدل النص الأساسي عندما يستخدم الزائر هذه اللغة.',
    tEn: 'الإنجليزية', tAr: 'العربية', tTitle: 'العنوان', tDescription: 'الوصف',
    added: 'تمت إضافة الرابط بنجاح.', updated: 'تم تحديث الرابط بنجاح.', deleted: 'تم حذف الرابط بنجاح.',
    enabledDone: 'تم تفعيل الرابط.', disabledDone: 'تم تعطيل الرابط.',
    saveError: 'تعذّر حفظ الرابط. يرجى المحاولة مرة أخرى.', updateError: 'تعذّر تحديث الرابط. يرجى المحاولة مرة أخرى.',
    deleteError: 'تعذّر حذف الرابط. يرجى المحاولة مرة أخرى.', notFound: 'هذا الرابط لم يعد موجودًا. تم تحديث القائمة.',
    saving: 'جارٍ الحفظ…', deleting: 'جارٍ الحذف…',
    confirmDelete: 'هل أنت متأكد أنك تريد حذف هذا الرابط؟', confirmDeleteNote: 'لا يمكن التراجع عن هذا الإجراء.',
    sessionExpired: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
    err_required: 'هذا الحقل مطلوب.', err_too_long: 'النص طويل جدًا.',
    err_invalid_url: 'أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://.', err_invalid_icon: 'اختر أيقونة.',
    err_not_number: 'أدخل رقمًا صحيحًا.', err_out_of_range: 'أدخل رقمًا بين 0 و 9999.',
    err_invalid_boolean: 'اختر نعم أو لا.', formErrors: 'يرجى تصحيح الحقول المحددة.'
  }
};
const KEY = 'virelo-admin-lang';
let lang = 'en';
try { const saved = localStorage.getItem(KEY); if (saved in STRINGS) lang = saved; } catch { /* ignore */ }

export const getLang = () => lang;
export const t = (key) => STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
export const errorText = (code) => t(`err_${code}`);

export function setLang(next) {
  if (!(next in STRINGS)) return;
  lang = next;
  try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  applyI18n();
}

/** Applies lang/dir, then translates [data-i18n], [data-i18n-aria] and [data-i18n-placeholder]. */
export function applyI18n(root = document) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  root.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach((n) => n.setAttribute('aria-label', t(n.dataset.i18nAria)));
  root.querySelectorAll('.lang__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  document.dispatchEvent(new CustomEvent('admin-lang-change', { detail: { lang } }));
}

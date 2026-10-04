// Controlled Virelo icon system — the single source of truth for the public page, the admin
// dashboard AND server-side validation. To add an icon, add one entry to ICONS (see README).
// Each icon is a list of SVG shapes drawn on a 24×24 grid with a 1.8 stroke.

export const ICONS = {
  website: { label: 'Website', shapes: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M2 12h20' }], ['path', { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' }]] },
  registration: { label: 'Registration', shapes: [['rect', { x: 8, y: 2, width: 8, height: 4, rx: 1 }], ['path', { d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' }], ['path', { d: 'm9 14 2 2 4-4' }]] },
  payment: { label: 'Payment', shapes: [['rect', { x: 2, y: 5, width: 20, height: 14, rx: 2 }], ['path', { d: 'M2 10h20' }], ['path', { d: 'M6 15h4' }]] },
  instagram: { label: 'Instagram', social: true, shapes: [['rect', { x: 3, y: 3, width: 18, height: 18, rx: 5 }], ['circle', { cx: 12, cy: 12, r: 4 }], ['circle', { cx: 17.5, cy: 6.5, r: 1, fill: 'currentColor' }]] },
  facebook: { label: 'Facebook', social: true, shapes: [['path', { d: 'M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z' }]] },
  youtube: { label: 'YouTube', social: true, shapes: [['rect', { x: 2, y: 5, width: 20, height: 14, rx: 4 }], ['path', { d: 'm10 9 5 3-5 3z' }]] },
  tiktok: { label: 'TikTok', social: true, shapes: [['path', { d: 'M14 3v11a4 4 0 1 1-4-4' }], ['path', { d: 'M14 3c.4 2.6 2 4 5 4' }]] },
  whatsapp: { label: 'WhatsApp', social: true, shapes: [['path', { d: 'M3 21l1.6-5A9 9 0 1 1 8 19.4z' }], ['path', { d: 'M9 9c0 3 3 6 6 6l1.5-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2z' }]] },
  community: { label: 'Community', shapes: [['circle', { cx: 9, cy: 8, r: 3 }], ['circle', { cx: 17, cy: 9, r: 2.5 }], ['path', { d: 'M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 6 1.5 6 5.5' }]] },
  channel: { label: 'Channel', shapes: [['path', { d: 'M3 11v3l12 5V6zM15 9c2 .5 3 1.5 3 3s-1 2.5-3 3M7 15l1 5h3l-1-4' }]] },
  education: { label: 'Education', shapes: [['path', { d: 'M22 10 12 5 2 10l10 5 10-5z' }], ['path', { d: 'M6 12v5c3 2 9 2 12 0v-5' }], ['path', { d: 'M22 10v6' }]] },
  book: { label: 'Book', shapes: [['path', { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' }], ['path', { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' }]] },
  exam: { label: 'Exam', shapes: [['path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }], ['path', { d: 'M14 2v6h6' }], ['path', { d: 'M8 13h8M8 17h5' }]] },
  student: { label: 'Student', shapes: [['path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }], ['circle', { cx: 12, cy: 7, r: 4 }]] },
  contact: { label: 'Contact', shapes: [['rect', { x: 2, y: 4, width: 20, height: 16, rx: 2 }], ['path', { d: 'm22 7-10 6L2 7' }]] },
  telegram: { label: 'Telegram', social: true, shapes: [['path', { d: 'M22 2 11 13' }], ['path', { d: 'm22 2-7 20-4-9-9-4z' }]] },
  linkedin: { label: 'LinkedIn', social: true, shapes: [['path', { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z' }], ['rect', { x: 2, y: 9, width: 4, height: 12 }], ['circle', { cx: 4, cy: 4, r: 2 }]] },
  'external-link': { label: 'External link', shapes: [['path', { d: 'M15 3h6v6' }], ['path', { d: 'M10 14 21 3' }], ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }]] }
};

export const ICON_NAMES = Object.keys(ICONS);
export const DEFAULT_ICON = 'external-link';
export const isSocialIcon = (name) => Boolean(ICONS[name]?.social);

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Build an <svg> element (DOM APIs only — no innerHTML). Browser-only. */
export function createIcon(name, className = 'icon') {
  const def = ICONS[name] || ICONS[DEFAULT_ICON];
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const [tag, attrs] of def.shapes) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    svg.appendChild(node);
  }
  return svg;
}

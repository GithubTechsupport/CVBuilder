import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'span'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'style'];

export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

export function isEmptyHtml(html: string | null | undefined): boolean {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() === '';
}

export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = sanitize(html);
  return div.textContent ?? '';
}

/** Turn a bare value into a link target when it looks like a URL or e-mail address. */
export function linkFor(value: string): string | null {
  const v = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v) && !/^\d/.test(v)) return `https://${v}`;
  return null;
}

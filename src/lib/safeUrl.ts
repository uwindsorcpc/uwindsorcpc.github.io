/**
 * Only http(s) and mailto links are rendered, so a bad value typed into the
 * admin page can never become a javascript: link.
 */
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^https?:\/\//i.test(v) || /^mailto:/i.test(v)) return v;
  return null;
}

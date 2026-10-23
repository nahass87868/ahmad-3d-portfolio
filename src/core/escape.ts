const MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape text for HTML text nodes and attribute values. */
export const esc = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) => MAP[c] as string);

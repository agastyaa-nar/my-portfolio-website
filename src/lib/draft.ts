// Unsaved admin edits are kept in this browser, so a refresh, a crash or a phone
// discarding a background tab never loses what you were typing.
const k = (key: string) => `portfolio-admin-draft:${key}`;

export function loadDraft<T>(key: string): T | null {
  try { const raw = localStorage.getItem(k(key)); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
export function saveDraft(key: string, value: unknown) {
  try { localStorage.setItem(k(key), JSON.stringify(value)); } catch { /* storage full or blocked: editing still works */ }
}
export function clearDraft(key: string) {
  try { localStorage.removeItem(k(key)); } catch { /* ignore */ }
}

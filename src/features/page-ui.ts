import { qs, qsa } from '../core/dom';

/** Flag images that fail to load so the hatch "Media missing" placeholder shows instead of a broken icon. */
export function initMissingImages(root: ParentNode): void {
  for (const img of qsa<HTMLImageElement>('img', root)) {
    const holder = img.closest('.th, figure');
    const flag = () => holder?.classList.add('missing');
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) flag();
    else img.addEventListener('error', flag, { once: true });
  }
}

/** Local time in the hero ("Syria time 14:05"). */
export function updateClock(): void {
  const el = qs('#clock');
  if (!el) return;
  try {
    el.textContent = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: el.dataset.tz || undefined,
    }).format(new Date());
  } catch {
    /* unknown time zone — keep the placeholder */
  }
}

/** Page-wide behaviour that is not tied to a view: the clock tick and "Copy address". */
export function initGlobalUi(): void {
  setInterval(updateClock, 30_000);

  let clearTimer: ReturnType<typeof setTimeout> | undefined;
  document.addEventListener('click', async (e) => {
    const button = (e.target as Element).closest<HTMLElement>('#mail');
    if (!button) return;
    const status = qs('#stat');
    if (!status) return;
    const email = button.dataset.email ?? '';
    try {
      await navigator.clipboard.writeText(email);
      status.textContent = 'Copied to clipboard';
    } catch {
      status.textContent = 'Copy failed. Email: ' + email;
    }
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => (status.textContent = ''), 2600);
  });
}

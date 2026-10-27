// The preview stays local and never changes desktop notification settings
export function initNotificationPreviews(document) {
  const cleanups = [];
  for (const preview of document.querySelectorAll('[data-notification-preview]')) {
    const quiet = preview.querySelector('[data-quiet-toggle]');
    const clear = preview.querySelector('[data-notification-clear]');
    const list = preview.querySelector('[data-notification-list]');
    const empty = preview.querySelector('[data-notification-empty]');
    const toggleQuiet = () => {
      const enabled = quiet.getAttribute('aria-pressed') !== 'true';
      quiet.setAttribute('aria-pressed', String(enabled));
      quiet.querySelector('[data-quiet-label]').textContent = enabled ? 'On' : 'Off';
    };
    const toggleHistory = () => {
      // Keep the sample entries in place so restoring needs no duplicate data
      list.hidden = !list.hidden;
      empty.hidden = !list.hidden;
      preview.querySelector('[data-notification-count]').textContent = String(list.hidden ? 0 : list.children.length);
      clear.textContent = list.hidden ? 'Restore demo' : 'Clear all';
    };
    quiet.disabled = false;
    clear.disabled = false;
    quiet.addEventListener('click', toggleQuiet);
    clear.addEventListener('click', toggleHistory);
    cleanups.push(() => {
      quiet.removeEventListener('click', toggleQuiet);
      clear.removeEventListener('click', toggleHistory);
    });
  }
  return () => { for (const cleanup of cleanups) cleanup(); };
}

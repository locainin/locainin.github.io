// Apply the preferred palette before the page paints
(() => {
  const root = document.documentElement;
  let saved;
  try {
    saved = localStorage.getItem('theme');
  } catch {
    // Reading can be blocked by browser privacy settings
  }
  let explicit = saved === 'light' || saved === 'dark';
  const systemTheme = window.matchMedia?.('(prefers-color-scheme: light)');
  root.dataset.theme = explicit ? saved : systemTheme?.matches ? 'light' : 'dark';

  let button;
  const updateLabel = () => {
    if (!button) return;
    const light = root.dataset.theme === 'light';
    button.setAttribute('aria-checked', String(light));
    button.querySelector('[data-theme-label]').textContent = light ? 'Light' : 'Dark';
  };

  // Follow system changes only until a theme is chosen
  systemTheme?.addEventListener?.('change', (event) => {
    if (explicit) return;
    root.dataset.theme = event.matches ? 'light' : 'dark';
    updateLabel();
  });

  document.addEventListener('DOMContentLoaded', () => {
    button = document.getElementById('theme-toggle');
    if (!button) return;
    button.hidden = false;
    updateLabel();

    button.addEventListener('click', () => {
      // Keep this choice for the page even if storage is blocked
      explicit = true;
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      updateLabel();
      try {
        localStorage.setItem('theme', root.dataset.theme);
      } catch {
        // Theme switching still works when saving is unavailable
      }
    });
  });
})();

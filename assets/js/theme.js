// Apply the saved palette before the page paints
(() => {
  const root = document.documentElement;
  let saved;
  try {
    saved = localStorage.getItem('theme');
  } catch {
    // Reading can be blocked by browser privacy settings
  }
  root.dataset.theme = saved === 'light' ? 'light' : 'dark';

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    button.hidden = false;

    const updateLabel = () => {
      const light = root.dataset.theme === 'light';
      button.setAttribute('aria-checked', String(light));
      button.querySelector('[data-theme-label]').textContent = light ? 'Light' : 'Dark';
    };
    updateLabel();

    button.addEventListener('click', () => {
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

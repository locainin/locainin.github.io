const INTRO_DURATION_MS = 10_000;
const SVG_NS = 'http://www.w3.org/2000/svg';

// SVG makes the title backdrop crisp while keeping its motion on the compositor
function createIntro(document) {
  const intro = document.createElementNS(SVG_NS, 'svg');
  intro.classList.add('article-intro');
  intro.setAttribute('viewBox', '0 0 1200 420');
  intro.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  intro.setAttribute('aria-hidden', 'true');
  intro.setAttribute('focusable', 'false');
  intro.style.setProperty('--article-intro-duration', `${INTRO_DURATION_MS}ms`);

  // Four spiral arms turn around a soft core without covering the title in a solid layer
  const arms = Array.from({ length: 4 }, (_, arm) => Array.from({ length: 32 }, (_, index) => {
    const distance = index / 31;
    const angle = distance * Math.PI * 1.9 + arm * Math.PI / 2;
    const radius = 18 + distance * 226;
    const x = 600 + Math.cos(angle) * radius;
    const y = 205 + Math.sin(angle) * radius * .42;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.1 + (1 - distance) * 1.1).toFixed(1)}" opacity="${(.28 + distance * .45).toFixed(2)}"/>`;
  }).join('')).join('');
  const stars = Array.from({ length: 65 }, (_, index) => {
    const x = (index * 137.51 + 29) % 1200;
    const y = 24 + (index * 79.13) % 356;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${index % 7 === 0 ? 2 : 1}"/>`;
  }).join('');
  const rays = Array.from({ length: 12 }, (_, index) => `<path d="M0 -42v-9" transform="rotate(${index * 30})"/>`).join('');

  intro.innerHTML = `
    <defs>
      <radialGradient id="article-galaxy-core"><stop stop-color="currentColor" stop-opacity=".2"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>
      <radialGradient id="article-sun-halo"><stop stop-color="currentColor" stop-opacity=".16"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>
    </defs>
    <g class="article-intro__stars">${stars}</g>
    <g class="article-intro__galaxy">
      <ellipse cx="600" cy="205" rx="285" ry="122" fill="url(#article-galaxy-core)"/>
      <g class="article-intro__arms">${arms}</g>
      <ellipse class="article-intro__orbit" cx="600" cy="205" rx="260" ry="100" transform="rotate(-18 600 205)"/>
      <circle cx="600" cy="205" r="3" class="article-intro__core"/>
    </g>
    <g class="article-intro__sun" transform="translate(146 138)">
      <circle r="91" fill="url(#article-sun-halo)"/>
      <circle r="28" class="article-intro__sun-body"/>
      <circle r="35" class="article-intro__sun-ring"/>
      <g class="article-intro__rays">${rays}</g>
    </g>
    <g class="article-intro__moon" transform="translate(1060 115)">
      <path d="M24 0A28 28 0 1 0 50 42A27 27 0 0 1 24 0Z"/>
      <path class="article-intro__moon-orbit" d="M-22 51C-12 80 56 79 73 35"/>
    </g>
    <g class="article-intro__shooting-star article-intro__shooting-star--one"><path d="M1010 24 912 83"/><circle cx="912" cy="83" r="2.5"/></g>
    <g class="article-intro__shooting-star article-intro__shooting-star--two"><path d="M390 78 320 120"/><circle cx="320" cy="120" r="2"/></g>
    <g class="article-intro__shooting-star article-intro__shooting-star--three"><path d="M1150 260 1070 308"/><circle cx="1070" cy="308" r="2"/></g>
    <g class="article-intro__spark"><path d="M218 276v12m-6-6h12M980 195v10m-5-5h10M76 53v8m-4-4h8"/></g>`;
  return intro;
}

export function initArticleIntro(document, browser) {
  // Archive pages keep their own media and do not get the opening scene
  const titleArea = document.querySelector('.reading-shell .article-header');
  if (!titleArea) return () => {};

  const motionPreference = browser.matchMedia('(prefers-reduced-motion: reduce)');
  // Hidden tabs and reduced motion keep the article quiet from the start
  if (motionPreference.matches || document.hidden) return () => {};

  const intro = createIntro(document);
  let active = true;
  let timeoutId;

  // The same cleanup handles completion, preferences, and page teardown
  const removeIntro = () => {
    if (!active) return;
    active = false;
    browser.clearTimeout(timeoutId);
    motionPreference.removeEventListener('change', onMotionPreferenceChange);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    intro.remove();
  };
  const onMotionPreferenceChange = () => {
    if (motionPreference.matches) removeIntro();
  };
  const onVisibilityChange = () => {
    if (document.hidden) removeIntro();
  };

  // Absolute positioning fills the title background without changing its measure
  titleArea.prepend(intro);
  motionPreference.addEventListener('change', onMotionPreferenceChange);
  document.addEventListener('visibilitychange', onVisibilityChange);
  // The timer ends with the CSS fade and releases the decorative nodes
  timeoutId = browser.setTimeout(removeIntro, INTRO_DURATION_MS);
  return removeIntro;
}

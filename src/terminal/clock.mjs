export function startSessionClock(browser, onTick) {
  let last = browser.performance.now();
  let scheduled = 0;
  let active = true;
  const step = (time) => {
    if (!active) return;
    // The original sl refreshes every 40ms; avoid redrawing its text on faster frames
    if (time - last >= 40) {
      onTick(time - last);
      last = time;
    }
    if (active) scheduled = browser.requestAnimationFrame(step);
  };
  const visibility = () => {
    browser.cancelAnimationFrame(scheduled);
    if (browser.document.hidden || !active) return;
    last = browser.performance.now();
    scheduled = browser.requestAnimationFrame(step);
  };
  browser.document.addEventListener('visibilitychange', visibility);
  visibility();
  return () => {
    active = false;
    browser.cancelAnimationFrame(scheduled);
    browser.document.removeEventListener('visibilitychange', visibility);
  };
}

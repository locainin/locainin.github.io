// Keep all content visible when motion is reduced or unsupported
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.08 });

  for (const element of document.querySelectorAll('.reveal')) {
    // Only hide items after their reveal observer has been attached
    observer.observe(element);
    element.classList.add('will-reveal');
  }
}

// A small browser demo shows notification history without requiring an image
export function renderNotificationPreview() {
  const entries = [
    `<article class="notification-item"><span class="notification-app-icon" aria-hidden="true">&gt;_</span><div><p><strong>Terminal</strong><span>now</span></p><h4>Build finished</h4><p>Everything is up to date.</p></div></article>`,
    `<article class="notification-item"><span class="notification-app-icon notification-app-icon--mail" aria-hidden="true">↗</span><div><p><strong>Desktop</strong><span>2m</span></p><h4>Screenshot saved</h4><p>Pictures/Screenshots</p></div></article>`,
  ];
  return `<section class="notification-preview" data-notification-preview aria-label="UnixNotis interface demo">
    <div class="notification-preview-top"><span><i aria-hidden="true"></i> UnixNotis</span><span>INTERFACE DEMO</span></div>
    <div class="notification-preview-heading"><strong>Control center</strong><span>Wayland / GTK4</span></div>
    <noscript><p class="nojs-note nojs-feature-note">no javascript, so this is a still preview. the actual app is on GitHub.</p></noscript>
    <button class="notification-quiet" type="button" data-quiet-toggle aria-pressed="false" disabled><span>Do not disturb</span><span class="notification-switch"><span data-quiet-label>Off</span><i aria-hidden="true"></i></span></button>
    <div class="notification-history-heading"><span>Notifications <span data-notification-count>${entries.length}</span></span><button type="button" data-notification-clear disabled>Clear all</button></div>
    <div class="notification-list" data-notification-list>${entries.join('')}</div>
    <p class="notification-empty" data-notification-empty hidden>All caught up.</p>
    <p class="notification-preview-foot">History, quiet mode &amp; rules for the desktop.</p>
  </section>`;
}

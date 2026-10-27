import { initNotificationPreviews } from './controller.mjs';

const dispose = initNotificationPreviews(document);
if (import.meta.hot) import.meta.hot.dispose(dispose);

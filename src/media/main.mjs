import { initMedia } from './controller.mjs';

const dispose = initMedia(document, window);
// Development updates release players and listeners before starting again
if (import.meta.hot) import.meta.hot.dispose(dispose);

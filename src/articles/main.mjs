import { initArticleIntro } from './intro.mjs';

const dispose = initArticleIntro(document, window);

// Development updates remove the previous scene before starting another
if (import.meta.hot) import.meta.hot.dispose(dispose);

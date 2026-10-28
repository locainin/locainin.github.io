import { intro } from './sequence.mjs';
import { articles } from '../data/articles.mjs';

// Public site content supplies the virtual files and their listing sizes
const rootDirectory = {
  name: '', href: 'index.html', children: [
    { name: 'about.txt', content: intro.about },
    { name: 'interests.txt', content: 'Linux desktops. Systems code. Anime.\nYes, the other window is staying.' },
    { name: '.secret', content: 'The anime window is load-bearing.\nStructurally? No. Emotionally? Absolutely.' },
    { name: '.motd', content: 'The train has right of way.\nAll other scheduling decisions are provisional.' },
    { name: 'articles', href: 'articles/', children: articles.map(article => ({ name: article.slug, href: `articles/${article.slug}/`, children: [] })) },
    { name: 'projects', href: 'projects/', children: [] },
  ],
};

export function resolveEntry(path) {
  if (!path) return { error: 'no such file or directory' };
  const stack = [rootDirectory];
  const relative = path.replace(/^~(?=\/|$)/, '');
  for (const name of relative.split('/').filter(Boolean)) {
    const current = stack.at(-1);
    if (!current.children) return { error: 'not a directory' };
    if (name === '.') continue;
    if (name === '..') { if (stack.length > 1) stack.pop(); continue; }
    const entry = current.children.find(entry => entry.name === name);
    // Validate each segment before processing a later parent-directory step
    if (!entry) return { error: 'no such file or directory' };
    stack.push(entry);
  }
  const entry = stack.at(-1);
  if (path.endsWith('/') && !entry.children) return { error: 'not a directory' };
  return { entry };
}

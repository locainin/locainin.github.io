import { readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { projectVideoType } from '../../src/data/projects.mjs';

// Slugs become URL segments and element IDs in generated markup
const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const markerPattern = /<!--\s*(?:theme-init|terminal-intro|shared-header|no-script-note|homepage-writing|homepage-projects|writing-summary|writing-archive|project-summary|projects-archive|article-detail)(?=[\s:<]|-->|$)|__PAGE_[A-Z0-9_]+__/;

function checkSlugs(records, label) {
  const seen = new Set();
  for (const record of records) {
    if (typeof record.slug !== 'string' || !safeSlug.test(record.slug)) {
      throw new Error(`Invalid ${label} slug: ${record.slug}`);
    }
    if (seen.has(record.slug)) throw new Error(`Duplicate ${label} slug: ${record.slug}`);
    seen.add(record.slug);
  }
}

async function checkArticles(root, routeFiles, articles) {
  checkSlugs(articles, 'article');
  const expected = new Map(articles.map((article) => [`articles/${article.slug}/index.html`, article]));
  const routes = new Map();

  // Compare against Vite's actual HTML inputs so unlisted pages cannot slip through
  for (const file of routeFiles) {
    const name = relative(root, resolve(root, file)).split(sep).join('/');
    if (name.startsWith('articles/') && name.endsWith('.html') && name !== 'articles/index.html') {
      if (!expected.has(name)) throw new Error(`Article route ${name} has no matching record`);
      routes.set(name, file);
    }
  }

  for (const [name, article] of expected) {
    if (!routes.has(name)) throw new Error(`Missing article route for ${article.slug}: ${name}`);
    if (!['coming-soon', 'published'].includes(article.status)) {
      throw new Error(`Invalid article status for ${article.slug}: ${article.status}`);
    }
    // Each route must render exactly the record that owns its URL
    const html = await readFile(resolve(root, routes.get(name)), 'utf8');
    const markers = [...html.matchAll(/<!--\s*article-detail\b[\s\S]*?-->/g)];
    if (markers.length !== 1 || markers[0][0] !== `<!-- article-detail:${article.slug} -->`) {
      throw new Error(`Article marker must match the route for ${article.slug}`);
    }
  }
}

async function checkMedia(root, project) {
  const { media, slug } = project;
  if (!media || typeof media !== 'object' || Array.isArray(media)) {
    throw new Error(`Missing project media for ${slug}`);
  }
  // Dimensions reserve space for the illustration before media loads
  for (const field of ['width', 'height']) {
    if (!Number.isSafeInteger(media[field]) || media[field] <= 0) {
      throw new Error(`Invalid project media ${field} for ${slug}`);
    }
  }
  for (const field of ['alt', 'description']) {
    if (typeof media[field] !== 'string' || !media[field].trim()) {
      throw new Error(`Invalid project media ${field} for ${slug}`);
    }
  }

  // Media records share the capability query used for the encoded WebM files
  if (media.type !== projectVideoType) {
    throw new Error(`Invalid project media type for ${slug}`);
  }
  if (typeof media.video === 'string' && !media.video.endsWith('.webm')) {
    throw new Error(`Invalid project media video path for ${slug}: ${media.video}`);
  }

  // Resolve each path to keep symlinks from pointing outside the site
  const realRoot = await realpath(root);
  for (const field of ['animation', 'video', 'poster']) {
    const value = media[field];
    if (typeof value !== 'string' || !/^[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*$/.test(value)
      || value.split('/').some((part) => part === '.' || part === '..')) {
      throw new Error(`Invalid project media ${field} path for ${slug}: ${value}`);
    }
    try {
      const file = await realpath(resolve(root, value));
      const location = relative(realRoot, file);
      if (location === '..' || location.startsWith(`..${sep}`) || isAbsolute(location) || !(await stat(file)).isFile()) {
        throw new Error('Media must be a file inside the site');
      }
    } catch (cause) {
      throw new Error(`Invalid project media ${field} path for ${slug}: ${value}`, { cause });
    }
  }
}

async function checkProjects(root, projects) {
  checkSlugs(projects, 'project');
  // Each home slot has a fixed place in the generated page
  for (const slot of ['notifications', 'stego', 'more']) {
    if (projects.filter((project) => project.home === slot).length !== 1) {
      throw new Error(`Homepage requires exactly one ${slot} project`);
    }
  }
  // Optional archive media follows the same contract as featured media
  for (const project of projects) {
    if (['stego', 'more'].includes(project.home) || project.media !== undefined) {
      await checkMedia(root, project);
    }
  }
}

export async function validateContent({ root, routeFiles, articleRecords, projectRecords }) {
  await checkArticles(root, routeFiles, articleRecords);
  await checkProjects(root, projectRecords);
}

export function assertNoGeneratedMarkers(html) {
  const match = html.match(markerPattern);
  if (match) throw new Error(`Unresolved generated marker: ${match[0]}`);
}

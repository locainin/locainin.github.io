import { articles } from '../../src/data/articles.mjs';
import { projects } from '../../src/data/projects.mjs';
import { renderNotificationPreview } from './notification.mjs';

const githubBase = 'https://github.com/locainin/';

// The browser shows this HTML only when page scripts are disabled
function renderNoScriptNotice(message, className = '') {
  return `<noscript><p class="nojs-note ${className}">${escapeHtml(message)}</p></noscript>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function articleUrl(article, rootHref) {
  return `${rootHref}articles/${article.slug}/`;
}

function stackLabel(stack = []) {
  return stack.map(escapeHtml).join(' <span aria-hidden="true">/</span> ');
}

// Both project animations share playback markup while keeping their own assets
function renderProjectAnimation(project, rootHref, className) {
  const { animation, video, poster, width, height, alt, description, caption } = project.media;
  const descriptionId = `${project.slug}-description`;
  return `<figure class="${className}" data-media-loop aria-label="${escapeHtml(alt)}" aria-describedby="${descriptionId}">
    <video data-project-video src="${rootHref}${escapeHtml(video)}" width="${width}" height="${height}" poster="${rootHref}${escapeHtml(poster)}" muted loop playsinline preload="none" hidden aria-hidden="true"></video>
    <picture>
      <source media="(prefers-reduced-motion: reduce)" srcset="${rootHref}${escapeHtml(poster)}">
      <img src="${rootHref}${escapeHtml(animation)}" width="${width}" height="${height}" loading="lazy" decoding="async" alt="${escapeHtml(alt)}" aria-describedby="${descriptionId}">
    </picture>
    <p class="sr-only" id="${descriptionId}">${escapeHtml(description)}</p>
    <figcaption>${caption ? `<span>${escapeHtml(caption)}</span>` : ''}<button type="button" data-loop-toggle hidden>Stop animation</button></figcaption>
  </figure>`;
}

function statusLabel(article) {
  if (article.status === 'coming-soon') return 'Coming soon';
  if (article.status === 'published') return 'Published';
  return '';
}

function renderSiteHeader(rootHref, section, noScriptMessage) {
  const homeHref = `${rootHref}index.html`;
  const current = (name) => section === name ? ' aria-current="page"' : '';
  return `<header class="site-header shell">
    <a class="wordmark" href="${homeHref}" aria-label="locainin home">locainin</a>
    <nav aria-label="Main navigation">
      <a href="${homeHref}"${current('home')}>Home</a>
      <a href="${rootHref}articles/"${current('articles')}>Articles</a>
      <a href="${rootHref}projects/"${current('projects')}>Projects</a>
      <a href="https://github.com/locainin">GitHub <span aria-hidden="true">↗</span></a>
    </nav>
    <button class="theme-toggle" id="theme-toggle" type="button" role="switch" aria-label="Light theme" aria-checked="false" hidden>
      <svg class="theme-moon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.4 13.1A8.5 8.5 0 0 1 10.9 3.6 8.5 8.5 0 1 0 20.4 13.1Z"/></svg>
      <svg class="theme-sun" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>
      <span data-theme-label>Dark</span>
    </button>
  </header>${section === 'home' ? '' : renderNoScriptNotice(noScriptMessage, 'shell nojs-page-note')}`;
}

function renderHomepageArticles(rootHref) {
  return `<div class="notes-index">
    ${articles.filter((article) => article.featured).map((article, index) => {
      const detail = article.readingMinutes ? `${article.category} / ${article.readingMinutes} min` : article.category;
      return `<article class="note">
        <a class="note-link" href="${articleUrl(article, rootHref)}">
          <span class="note-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
          <div class="note-copy"><p class="note-kind">${escapeHtml(detail)} <span>${statusLabel(article)}</span></p><h3>${escapeHtml(article.title)}</h3><p class="note-excerpt">${escapeHtml(article.excerpt)}</p></div>
          <span class="note-arrow" aria-hidden="true">↗</span>
        </a>
      </article>`;
    }).join('')}
  </div>`;
}

function renderProjectCopy(project, index, options = {}) {
  const {
    element = 'div',
    heading = 'h3',
    className = 'project-copy',
    archiveLink = false,
    showNumber = true,
    showStack = true,
  } = options;
  const href = `${githubBase}${encodeURIComponent(project.repository)}`;
  const label = showNumber
    ? `${String(index + 1).padStart(2, '0')} / ${project.category}`
    : project.category;
  const attrs = element === 'a' ? ` href="${href}"` : '';
  const link = archiveLink
    ? `<a class="project-source" href="${href}">GitHub source <span aria-hidden="true">↗</span></a>`
    : '<span class="repository-link">View repository <span aria-hidden="true">↗</span></span>';
  const note = project.note ? `<span class="project-note">${escapeHtml(project.note)}</span>` : '';
  return `<${element} class="${className}"${attrs}>
    <span class="project-index">${escapeHtml(label)}</span>
    <${heading}>${escapeHtml(project.title)}</${heading}>
    <p>${escapeHtml(project.description)}</p>
    ${showStack ? `<span class="project-stack">${stackLabel(project.stack)}</span>` : ''}
    ${note}
    ${link}
  </${element}>`;
}

function renderFeaturedProject(project, index) {
  if (project.home === 'notifications') {
    return `<article class="project">
      <div class="project-feature-link">
        ${renderProjectCopy(project, index, { element: 'a' })}
        ${renderNotificationPreview()}
      </div>
    </article>`;
  }

  return `<article class="project">
    <div class="project-feature-link">
      ${renderProjectCopy(project, index, { element: 'a' })}
      ${renderProjectAnimation(project, '', 'project-visual stego-demo')}
    </div>
  </article>`;
}

function renderHomepageProjects() {
  const featured = projects.filter((project) => ['notifications', 'stego'].includes(project.home));
  const moreProject = projects.find((project) => project.home === 'more');
  return `<p class="project-group-label">Featured projects</p>
    <div class="project-features">${featured.map(renderFeaturedProject).join('')}</div>
    <p class="project-group-label project-group-label--more">More projects</p>
    <div class="project-continuation">
      <article class="project project-more-entry">
        ${renderProjectCopy(moreProject, featured.length, { element: 'a', showStack: false })}
        ${renderProjectAnimation(moreProject, '', 'project-animation proton-demo')}
      </article>
      <a class="project-directory-link" href="projects/">
        <span class="project-directory-path">~/projects</span>
        <strong>Explore all projects <span aria-hidden="true">↗</span></strong>
        <span>${projects.length} repositories. More things to dig into.</span>
      </a>
    </div>`;
}

function renderArticleSummary() {
  const groups = [
    ['coming-soon', 'Coming soon'],
    ['published', 'Published'],
  ];
  return `<div class="writing-hero-counts" aria-label="Article archive counts">${groups.map(([status, label]) => {
    const count = articles.filter((article) => article.status === status).length;
    return count ? `<span><strong>${String(count).padStart(2, '0')}</strong><span>${label}</span></span>` : '';
  }).join('')}</div>`;
}

function renderArticleArchive(rootHref) {
  return articles.map((article, index) => {
    const status = article.readingMinutes
      ? `${statusLabel(article)} · ${article.readingMinutes} min read`
      : statusLabel(article);
    return `<article class="archive-article archive-article--${escapeHtml(article.status)}">
      <a class="archive-article-link" href="${articleUrl(article, rootHref)}">
        <span class="archive-article-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
        <div class="archive-article-copy"><p class="archive-article-label">${escapeHtml(article.category)}</p><h2>${escapeHtml(article.title)}</h2><p class="archive-excerpt">${escapeHtml(article.excerpt)}</p></div>
        <div class="archive-article-meta"><span>${escapeHtml(status)}</span><span class="archive-arrow" aria-hidden="true">↗</span></div>
      </a>
    </article>`;
  }).join('');
}

function renderProjectSummary() {
  const featured = projects.filter((project) => ['notifications', 'stego'].includes(project.home)).length;
  return `<div class="project-archive-summary"><strong>${String(projects.length).padStart(2, '0')}</strong><span>repositories</span><span class="project-archive-summary-note">${String(featured).padStart(2, '0')} featured / ${String(projects.length - featured).padStart(2, '0')} more</span></div>`;
}

function renderProjectFeature(project, index, rootHref) {
  const info = renderProjectCopy(project, index, {
    heading: 'h2',
    className: 'project-archive-feature-copy',
    archiveLink: true,
  });
  if (project.home === 'notifications') {
    return `<article class="project-archive-feature project-archive-feature--notifications">
      ${info}
      ${renderNotificationPreview()}
    </article>`;
  }

  return `<article class="project-archive-feature project-archive-feature--stego">
    <figure class="project-archive-poster">
      <img src="${rootHref}${project.media.poster}" width="960" height="680" loading="lazy" decoding="async" alt="An encrypted container is hidden in small RGB channel changes, leaving the image nearly unchanged">
      <figcaption>INPLAINSIGHT / RGB LSB ILLUSTRATION</figcaption>
    </figure>
    ${info}
  </article>`;
}

function renderProjectArchive(rootHref) {
  const featured = projects.filter((project) => ['notifications', 'stego'].includes(project.home));
  const remaining = projects.filter((project) => !['notifications', 'stego'].includes(project.home));
  return `<div class="project-archive-featured">
      ${featured.map((project) => renderProjectFeature(project, projects.indexOf(project), rootHref)).join('')}
    </div>
    <section class="project-archive-more" aria-labelledby="project-archive-more-title">
      <header class="project-archive-more-heading"><p class="project-archive-path"><span>02</span> / MORE FROM THE REPOSITORY LIST</p><h2 id="project-archive-more-title">Further down the tree<span> /</span></h2></header>
      <div class="archive-project-list">${remaining.map((project) => {
        const index = projects.indexOf(project);
        return `<article class="archive-project">
          <span class="archive-project-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
          <div class="archive-project-details${project.media ? ' archive-project-details--media' : ''}">${renderProjectCopy(project, index, { heading: 'h3', className: 'archive-project-copy', archiveLink: true, showNumber: false })}${project.media ? renderProjectAnimation(project, rootHref, 'project-animation archive-project-animation') : ''}</div>
        </article>`;
      }).join('')}</div>
    </section>`;
}

function renderArticleHeader(article, rootHref) {
  const byline = article.readingMinutes
    ? `<p class="article-byline">${escapeHtml(statusLabel(article))} · ${article.readingMinutes} min read</p>`
    : `<p class="article-status">${escapeHtml(statusLabel(article))}</p>`;
  return `<header class="article-header"><a class="back-link" href="${rootHref}articles/">← All articles</a><p class="eyebrow">${escapeHtml(article.category)} / ${escapeHtml(statusLabel(article))}</p><h1>${escapeHtml(article.title)}</h1><p class="article-deck">${escapeHtml(article.deck)}</p>${byline}</header>`;
}

function renderArticleDetail(article, rootHref) {
  const header = renderArticleHeader(article, rootHref);
  const body = article.status === 'coming-soon'
    ? '<section class="article-placeholder" aria-label="Article status"><p>This article is in progress.</p></section>'
    // Static source markup becomes the article body once writing is ready
    : `<div class="article-body">${article.body}</div>`;
  if (article.status !== 'coming-soon' && (!article.body || typeof article.body !== 'string')) {
    throw new Error(`Published article requires authored body markup: ${article.slug}`);
  }
  return `<article>
    ${header}
    ${body}
  </article>
  <a class="article-next" href="${rootHref}articles/"><span class="eyebrow">Articles ↗</span><strong>Browse all articles</strong></a>`;
}

export function renderContentMarkers(html, { rootHref, section }) {
  const articleMarker = html.match(/<!-- article-detail:([a-z0-9-]+) -->/);
  const article = articleMarker ? articles.find((item) => item.slug === articleMarker[1]) : null;
  const pageNote = article
    ? `${article.title}, without the extra motion. no javascript needed :)`
    : section === 'projects'
      ? 'no javascript? the projects and their source links are still here :)'
      : 'no javascript, just the article index. browse at your own pace :)';
  html = html.replace('<!-- shared-header -->', renderSiteHeader(rootHref, section, pageNote));
  html = html.replace('<!-- no-script-note -->', renderNoScriptNotice('no javascript? fair enough :) the video still plays with its own controls.', 'nojs-media-note'));
  html = html.replace('<!-- homepage-writing -->', renderHomepageArticles(rootHref));
  html = html.replace('<!-- homepage-projects -->', renderHomepageProjects());
  html = html.replace('<!-- writing-summary -->', renderArticleSummary());
  html = html.replace('<!-- writing-archive -->', renderArticleArchive(rootHref));
  html = html.replace('<!-- project-summary -->', renderProjectSummary());
  html = html.replace('<!-- projects-archive -->', renderProjectArchive(rootHref));

  if (articleMarker) {
    const slug = articleMarker[1];
    if (!article || !['coming-soon', 'published'].includes(article.status)) {
      throw new Error(`Unknown article template: ${slug}`);
    }
    html = html.replace(articleMarker[0], renderArticleDetail(article, rootHref));
    html = html.replace('__PAGE_TITLE__', `${escapeHtml(article.title)} — locainin`);
    html = html.replace('__PAGE_DESCRIPTION__', escapeHtml(article.description));
  }

  return html;
}

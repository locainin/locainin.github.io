import { createHash, randomUUID } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'ripple/compiler';
import { prerender } from 'ripple/server';
import { renderContentMarkers } from './content/render.mjs';

const component = new URL('../src/terminal/TerminalIntro.tsrx', import.meta.url);
const theme = new URL('../assets/js/theme.js', import.meta.url);
const siteRoot = fileURLToPath(new URL('../', import.meta.url));

function relativeSiteRoot(filename) {
  const path = relative(dirname(filename), siteRoot).split(sep).join('/');
  return path ? `${path}/` : '';
}

async function compileTerminal() {
  const source = await readFile(component, 'utf8');
  const compiled = compile(source, fileURLToPath(component), { mode: 'server' });
  if (compiled.errors.length) throw new Error(compiled.errors.map((error) => error.message).join('\n'));
  // A sibling module keeps relative imports intact without leaving build files behind
  const temporary = new URL(`.terminal-ssr-${randomUUID()}.mjs`, component);
  await writeFile(temporary, compiled.code);
  try {
    return await import(temporary.href);
  } finally {
    await rm(temporary, { force: true });
  }
}

export function staticHtml() {
  return {
    name: 'locainin-static-html',
    transformIndexHtml: {
      order: 'pre',
      async handler(html, context) {
        // Directory-relative links keep each generated page below any repository prefix
        const section = relative(siteRoot, context.filename).split(sep)[0].replace('.html', '');
        html = renderContentMarkers(html, { rootHref: relativeSiteRoot(context.filename), section: section === 'index' ? 'home' : section });
        // Keep the inline bytes consistent with HTML's newline normalization
        const themeSource = (await readFile(theme, 'utf8')).replace(/\r\n?/g, '\n');
        // Inline the shared theme script so saved preferences apply before painting
        html = html.replace('<!-- theme-init -->', `<script>${themeSource}</script>`);
        if (!context.server) {
          // The hash permits this one inline script while other code stays blocked
          const hash = createHash('sha256').update(themeSource).digest('base64');
          const policy = `default-src 'none'; base-uri 'none'; object-src 'none'; script-src 'self' 'sha256-${hash}'; style-src 'self'; img-src 'self'; font-src 'self'; media-src 'self'; connect-src 'none'; form-action 'self'`;
          if (!html.includes('<head>')) throw new Error('Cannot add the content security policy without a head');
          // Enforce the policy before browsers see any scripts or resource links
          html = html.replace('<head>', `<head>\n  <meta http-equiv="Content-Security-Policy" content="${policy}">`);
        }
        if (!html.includes('<!-- terminal-intro -->')) return html;
        const { TerminalIntro } = context.server
          ? await context.server.ssrLoadModule('/src/terminal/TerminalIntro.tsrx')
          : await compileTerminal();
        const output = await prerender(() => TerminalIntro({ animate: false }));
        if (output.topLevelError) throw output.topLevelError;
        return html.replace('<!-- terminal-intro -->', output.body);
      },
    },
  };
}

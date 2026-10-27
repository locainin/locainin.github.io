import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';
import { staticHtml } from './scripts/static-html.mjs';

const root = new URL('./', import.meta.url);

function discoverRouteEntries(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name)).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return discoverRouteEntries(path);
    return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
  });
}

const routes = ['articles', 'projects'].flatMap((directory) => discoverRouteEntries(fileURLToPath(new URL(`${directory}/`, root))));

export default defineConfig({
  // Relative assets support account sites and repositories with any name
  base: './',
  plugins: [ripple({ excludeRippleExternalModules: true }), staticHtml()],
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: {
    rolldownOptions: {
      input: [fileURLToPath(new URL('index.html', root)), ...routes],
    },
  },
});

# locainin / software & notes

A personal site with an animated zsh-style introduction, a personal media corner, article previews, two featured projects and one more project preview, and complete writing and project archives. The terminal uses Ripple 0.4.7; Vite 8.3.5 builds the site into static files for GitHub Pages. Bun installs the pinned dependencies from `bun.lock` and runs package scripts; Node.js 22.12 or newer is required by Vite. There is no server runtime to deploy.

## Local development

Use Bun and Node.js 22.12 or newer. Run commands from this directory:

```sh
bun install
bun run dev
```

Open `http://127.0.0.1:4173/`. Stop the server with Ctrl+C.

For the production build and preview:

```sh
bun run build
bun run preview
```

The preview uses the same port, so stop the development server first. Opening the source HTML directly does not compile the terminal or inject its static content.

## Deployment

The public site is https://locainin.github.io/ and its source lives in https://github.com/locainin/locainin.github.io.

Push source changes to `main` to run the pinned GitHub Actions workflow in `.github/workflows/pages.yml`. It installs the locked dependencies with Bun 1.4.4, builds with Node.js 24, and publishes only `dist/` to GitHub Pages. The workflow can also be run manually from the Actions tab. Deployment permissions are limited to the publishing job; the build job only reads source and Pages metadata.

GitHub Pages uses the GitHub Actions publishing source with HTTPS enforced. There is no custom domain. Relative asset and page URLs also support repository-prefix hosting.

For a local production build:

```sh
bun install --frozen-lockfile
bun run build
```

`node_modules/`, `dist/`, local test suites, benchmarks, generated ZIPs, caches, logs, and `.env` files are excluded from the public source repository. Keep `bun.lock`, source files, `public/`, and media assets committed. The GIF fallbacks and lossless video previews are both used by the site.

The current release contains only Pacing the Frontier and Codebreaker 2026, both labeled Coming soon. A fresh build removes deleted routes from the deployed output.

## Rights

The original site code and content are all rights reserved; see [COPYRIGHT.md](COPYRIGHT.md). No open-source license is granted. Third-party materials retain their own terms and rights, and their software/font notices are kept in `public/licenses/` and copied to the site.

## Editing

- **Intro text and timing:** `src/terminal/sequence.mjs` holds the handle, commands, description, and typing stages
- **Terminal replies:** `src/terminal/commands.mjs` holds the supported commands, personal notes, and directory links
- **Terminal markup:** `src/terminal/TerminalIntro.tsrx` supplies both the compiled browser component and the static build output
- **Content metadata:** `src/data/articles.mjs` and `src/data/projects.mjs` are the shared source for homepage previews, archive entries, and article headers. Both current articles have `featured: true`; project `home` values select the two featured entries and one entry under More projects
- **Home composition:** `index.html` holds the page structure and content markers. UnixNotis uses an image-free interactive control-center preview; InPlainSight uses an original animated GIF illustrating RGB LSB embedding
- **Articles:** the two forthcoming directory routes stay labeled Coming soon. Add authored HTML in the record's `body`, update its title, deck, description, category, and reading time, then set `status: 'published'`.
- **Add an article:** create `articles/<slug>/index.html` using a forthcoming page as a template, update its `article-detail:<slug>` marker, and add the matching metadata record. The build discovers HTML files automatically.
- **Shared rendering:** `scripts/content/render.mjs` renders navigation, previews, archives, and article headers during the build. Directory routes use relative links so direct visits and refreshes work under a repository prefix
- **Appearance:** shared colors, fonts, navigation, and footer live in `assets/css/base.css`; page layouts live in `home.css`, `projects.css`, `terminal.css`, `article.css`, `archive.css`, and `notification.css`
- **Article opening:** `src/articles/` and `article-intro.css` provide a non-blocking SVG starfield across the article title background, with a sun, crescent moon, shooting stars, and a slowly rotating galaxy. It fades in over 2.7 seconds and is removed after ten seconds; reduced motion and hidden pages skip it
- **ProtonInformer illustration:** `assets/proton/` holds the GIF, poster, and workflow sources. Rebuild it with `bun run render:proton`; its renderer uses the same installed Python/Pillow/FFmpeg tools as the steganography illustration
- **Steganography illustration:** `assets/stego/` contains the primary GIF, reduced-motion poster, original cover art, source references, and generation prompt. Rebuild it with `bun run render:stego`; rendering requires Python 3, Pillow, Fontconfig, and FFmpeg
- **Notification demo:** `scripts/content/notification.mjs` supplies shared markup, `src/notifications/` handles quiet mode and clear/restore, and `notification.css` styles the preview. It uses sample notifications and does not connect to a desktop daemon
- **Personal media:** `assets/media/` contains optimized silent loops and still posters derived from the supplied MP4 and GIF. Playback controls live in `src/media/controller.mjs`
- **Theme behavior:** `assets/js/theme.js` initializes the selected theme before paint and manages the toggle on every page

Rebuild after source edits before publishing. The `dist/` directory is generated output.

## Behavior and accessibility

The terminal runs a 24-second browser-side zsh-style session. It types `whoami`, displays an ASCII handle immediately, types `cat about.txt`, leaves six seconds to read the description, then types `sl`. The completed command stays visible for 600 ms before a locomotive with cycling wheels and smoke takes over the fixed terminal viewport, clears, and restarts. Command typing uses 400 ms per character. Pause/resume preserves progress, hidden tabs suspend time, and Skip shows the completed introduction. Reduced motion shows the complete introduction without starting a timer.

The full introduction is prerendered. Local fonts finish loading before the browser component mounts, and the complete intro stays visible until the first command character is ready. The terminal's fixed content area keeps the neighboring anime window still during typing, train, and reset phases. The accessible heading remains the plain-text handle while the visible output uses ASCII art.

After Skip, the optional prompt responds to `help`, `ls`, `ls -a`, `whoami`, `pwd`, `cat about.txt`, `cat interests.txt`, `sl`, and `clear`. The `sl` command starts the browser animation; input never reaches a system shell. Other replies are local text and links, with one response replacing the last. The regular navigation remains available throughout.

The train art is adapted from [Toyoda Masashi's sl](https://github.com/mtoyoda/sl); its copyright and redistribution notice are preserved in `public/licenses/SL-LICENSE.txt` and included in the build. The labeled light/dark switch updates its icon and accessible state, and stores the choice locally; blocked storage does not prevent theme controls from working.

All three video loops have play/pause controls, including the supplied [Tenor clip](https://tenor.com/view/f-gif-4760985315022978212) on the articles archive. That 1.2-second clip is served locally as a silent 498×280 MP4 with a still poster. InPlainSight and ProtonInformer use lossless RGB VP9 video when supported, with their original GIFs as fallbacks. Every decoded frame and timestamp is checked against the GIF. Their independent stop/play controls still return to the same posters; reduced motion starts on the poster. Unsupported playback or decode errors retain the GIF controls. Reduced motion leaves their still posters visible until playback is requested; hidden tabs and offscreen players pause playback, and a manual pause persists when returning. Offscreen project videos also release their source and decoder; they restart from the beginning when visible, matching the GIF restart behavior. Without JavaScript, the regular clips keep native browser playback controls, and the original GIF pictures remain available. With reduced motion, those pictures select their still posters. JavaScript replaces native controls only after the existing custom controls are installed, and restores them if the player is removed. Contextual `<noscript>` notes explain the video controls, article index, project links, static terminal, and notification preview; the site content and navigation remain available. The dance video plays its full 72-second duration before looping, with its complete frame preserved at 640×360. The original 2.45-second GIF is encoded as a 400×224 MP4. All videos are served without audio tracks.

Lossless videos are larger downloads than the GIFs but avoid retaining the entire decoded GIF frame cache. The player loads them only while visible. `bun run encode:animations` rebuilds them from the approved GIFs; the render commands also run this encoding step. The original animation files, artwork, dimensions, color values, timing, and controls are preserved.

The bundled Ripple runtime and its shared runtime helpers retain their MIT notice in `public/licenses/Ripple-MIT.txt`, copied unchanged from the installed package.

All fonts and assets are local. There are no analytics, remote fonts, or runtime third-party asset requests. Font licenses are included in `public/licenses/` and copied into the production build.

## Browser security policy

Production HTML includes a Content Security Policy generated during the build. It authorizes the exact inline theme initializer by SHA-256 hash, allows the local resources needed by the site, and restricts other content sources. Development output keeps Vite hot reload available. No analytics or third-party scripts are loaded.

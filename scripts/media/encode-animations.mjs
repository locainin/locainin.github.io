import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects } from '../../src/data/projects.mjs';

const root = new URL('../../', import.meta.url);
const selected = process.argv[2];
const targets = projects.filter((project) => project.media && (selected === undefined || project.slug === selected));
// Reject empty or misspelled selections before any output can be replaced
if (selected !== undefined && targets.length === 0) throw new Error(`Unknown animated project: ${selected}`);
if (process.argv.length > 3) throw new Error('Usage: encode:animations [project-slug]');
const cache = fileURLToPath(new URL('.cache/', root));
mkdirSync(cache, { recursive: true });
for (const project of targets) {
  const input = fileURLToPath(new URL(project.media.animation, root));
  const output = fileURLToPath(new URL(project.media.video, root));
  // An interrupted encode may leave ignored working files, never a partial approved asset
  const temporary = mkdtempSync(join(cache, 'animation-'));
  const encoded = join(temporary, basename(output));
  try {
    // Preserve the final GIF pixels, palette, and millisecond timestamps
    execFileSync('ffmpeg', [
      '-v', 'error', '-nostdin', '-i', input, '-an',
      '-c:v', 'libvpx-vp9', '-lossless', '1', '-pix_fmt', 'gbrp',
      '-colorspace', 'rgb', '-color_range', 'pc', '-row-mt', '1', '-threads', '2',
      '-enc_time_base', '1/1000', '-fps_mode', 'passthrough', encoded,
    ], { stdio: 'inherit' });
    // Rename only after success so the previous video stays usable on failure
    renameSync(encoded, output);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
  console.log(`Encoded pixel-identical video for ${project.title}`);
}

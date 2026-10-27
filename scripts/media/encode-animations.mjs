import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { projects } from '../../src/data/projects.mjs';

const root = new URL('../../', import.meta.url);
const selected = process.argv[2];
for (const project of projects.filter((project) => project.media && (!selected || project.slug === selected))) {
  const input = fileURLToPath(new URL(project.media.animation, root));
  const output = fileURLToPath(new URL(project.media.video, root));
  // Encode the final GIF pixels, preserving its palette and millisecond timestamps
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-i', input, '-an',
    '-c:v', 'libvpx-vp9', '-lossless', '1', '-pix_fmt', 'gbrp',
    '-colorspace', 'rgb', '-color_range', 'pc', '-row-mt', '1', '-threads', '2',
    '-enc_time_base', '1/1000', '-fps_mode', 'passthrough', output,
  ], { stdio: 'inherit' });
  console.log(`Encoded pixel-identical video for ${project.title}`);
}

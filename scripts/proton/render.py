from pathlib import Path
import subprocess
import tempfile

from frames import DURATION, SIZE, WorkflowIllustration

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'assets' / 'proton'
FPS = 10


def run(*arguments):
    subprocess.run(arguments, check=True)


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    scene = WorkflowIllustration()
    # The poster holds on the exact-path verification step
    scene.frame(13.3).save(ASSETS / 'poster.webp', 'WEBP', quality=92, method=6)

    with tempfile.TemporaryDirectory(prefix='locainin-proton-') as scratch:
        frames = Path(scratch)
        for index in range(DURATION * FPS):
            scene.frame(index / FPS).save(frames / f'{index:04d}.png')

        # One shared palette keeps the interface colors stable across the loop
        palette = frames / 'palette.png'
        run(
            'ffmpeg', '-y', '-v', 'error', '-framerate', str(FPS),
            '-i', str(frames / '%04d.png'),
            '-vf', 'palettegen=max_colors=128:stats_mode=diff', str(palette),
        )
        run(
            'ffmpeg', '-y', '-v', 'error', '-framerate', str(FPS),
            '-i', str(frames / '%04d.png'), '-i', str(palette),
            '-lavfi', 'paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle',
            '-loop', '0', str(ASSETS / 'protoninformer.gif'),
        )

    print(f'Rendered {DURATION}s {SIZE[0]}×{SIZE[1]} GIF at {FPS} fps')
    for path in (ASSETS / 'protoninformer.gif', ASSETS / 'poster.webp'):
        print(f'{path.relative_to(ROOT)}: {path.stat().st_size:,} bytes')


if __name__ == '__main__':
    main()

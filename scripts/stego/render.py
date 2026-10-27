from pathlib import Path
import subprocess
import tempfile

from frames import Illustration
from model import DURATION

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'assets' / 'stego'
FPS = 12


def run(*arguments):
    subprocess.run(arguments, check=True)


def main():
    scene = Illustration(ASSETS / 'cover.png')
    # A still overview remains useful when animation is stopped or motion is reduced
    scene.frame(16).save(ASSETS / 'poster.webp', quality=90)
    with tempfile.TemporaryDirectory(prefix='locainin-stego-') as scratch:
        frames = Path(scratch)
        for index in range(DURATION * FPS):
            scene.frame(index / FPS).save(frames / f'{index:04d}.png')
        # One shared palette avoids color flicker between neighboring frames
        palette = frames / 'palette.png'
        run('ffmpeg', '-y', '-v', 'error', '-framerate', str(FPS), '-i', str(frames / '%04d.png'), '-vf', 'palettegen=stats_mode=diff', str(palette))
        run('ffmpeg', '-y', '-v', 'error', '-framerate', str(FPS), '-i', str(frames / '%04d.png'), '-i', str(palette), '-lavfi', 'paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle', '-loop', '0', str(ASSETS / 'inplainsight.gif'))
    print(f'Rendered {DURATION}s GIF: {ASSETS.relative_to(ROOT) / "inplainsight.gif"}')


if __name__ == '__main__':
    main()

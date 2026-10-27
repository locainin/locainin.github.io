import math
import subprocess

from PIL import Image, ImageDraw, ImageFont, ImageOps

from model import EXAMPLE_BITS, replace_lsb, stage_at

SIZE = (960, 680)
BACKGROUND = '#10131c'
WHITE = '#f0f0f5'
MUTED = '#b6bdce'
BLUE = '#a7b6ff'
PINK = '#e5a6c2'
LINE = '#394057'
BOX = (34, 110, 926, 600)


def font(family, size):
    # Font discovery keeps the render script independent of local font paths
    path = subprocess.check_output(['fc-match', family, '-f', '%{file}'], text=True).strip()
    return ImageFont.truetype(path, size)


class Illustration:
    def __init__(self, source):
        self.fonts = {size: font('monospace', size) for size in (16, 18, 20, 24, 28, 32, 38)}
        self.cover = ImageOps.fit(Image.open(source).convert('RGB'), (892, 490), centering=(.5, .35))
        self.points = [(160, 333), (633, 392), (392, 274), (802, 254), (267, 352), (579, 313), (454, 196), (749, 338)]
        # A warm midtone makes the enlarged color patch and its binary value legible
        self.points[0] = min(
            ((x, y) for y in range(240, 470, 2) for x in range(80, 850, 2)),
            key=lambda point: sum((value - target) ** 2 for value, target in zip(self.cover.getpixel(point), (174, 128, 91))),
        )
        # An even starting red value makes the first illustrated write change 0 to 1
        x, y = self.points[0]
        red, green, blue = self.cover.getpixel((x, y))
        self.cover.putpixel((x, y), (red & 0xFE, green, blue))
        self.after = self.cover.copy()
        for index, point in enumerate(self.points):
            channels = list(self.after.getpixel(point))
            channel = index % 3
            channels[channel] = replace_lsb(channels[channel], EXAMPLE_BITS[index])
            self.after.putpixel(point, tuple(channels))
        self.before_red = self.cover.getpixel(self.points[0])[0]
        self.after_red = self.after.getpixel(self.points[0])[0]
        self.changed = sum(self.cover.getpixel(point) != self.after.getpixel(point) for point in self.points)

    def text(self, draw, xy, value, size=18, color=WHITE):
        draw.text(xy, value, font=self.fonts[size], fill=color)

    def panel(self, draw, bounds, fill=BACKGROUND, outline=LINE, radius=8):
        draw.rounded_rectangle(bounds, radius=radius, fill=fill, outline=outline, width=2)

    def image(self, canvas, modified=False):
        canvas.paste(self.after if modified else self.cover, BOX[:2])

    def header(self, draw, index, label, headline):
        self.text(draw, (34, 19), f'{index} / {label}', 16, BLUE)
        self.text(draw, (34, 50), headline, 32)

    def footer(self, draw, text):
        self.text(draw, (34, 628), text, 20, MUTED)

    def dim(self, canvas, amount):
        return Image.blend(canvas, Image.new('RGB', SIZE, BACKGROUND), amount)

    def frame(self, seconds):
        stage, progress = stage_at(seconds)
        canvas = Image.new('RGB', SIZE, BACKGROUND)
        self.image(canvas, stage in ('scatter', 'reveal'))
        if stage in ('encrypt', 'pixel'):
            canvas = self.dim(canvas, .72 if stage == 'encrypt' else .88)
        draw = ImageDraw.Draw(canvas)

        if stage == 'note':
            self.header(draw, '01', 'THE COVER', 'A secret. An ordinary image.')
            offset = round(18 * (1 - min(1, progress * 3)))
            self.panel(draw, (66, 398 + offset, 590, 556 + offset), '#eae7df', '#eae7df')
            self.text(draw, (88, 417 + offset), 'note.txt', 16, '#626574')
            self.text(draw, (88, 455 + offset), 'meet me under the moon.', 24, '#272930')
            self.text(draw, (88, 503 + offset), 'a little something to keep.', 16, '#626574')
            self.footer(draw, 'A message to hide. A lossless image to hide it in.')

        elif stage == 'encrypt':
            self.header(draw, '02', 'BEFORE THE PIXELS', 'Package first. Encrypt next.')
            self.panel(draw, (64, 188, 402, 428))
            self.text(draw, (88, 211), 'note.txt + metadata', 18, BLUE)
            self.text(draw, (88, 274), 'meet me under', 24)
            self.text(draw, (88, 312), 'the moon.', 24)
            self.text(draw, (423, 282), '→', 38, PINK)
            self.panel(draw, (480, 188, 896, 428))
            self.text(draw, (504, 211), 'encrypted container', 18, BLUE)
            self.text(draw, (504, 274), 'A7  3F  90  6C', 28, PINK)
            self.text(draw, (504, 319), '11  D2  48  B0', 28, PINK)
            self.text(draw, (504, 379), '+ salt, nonce, framing', 16, MUTED)
            # The orbiting marker connects the two ideas without pretending to run encryption
            draw.ellipse((430, 350 - 60 * progress, 442, 362 - 60 * progress), fill=BLUE)
            self.text(draw, (66, 492), 'The picture gets container bits,', 24)
            self.text(draw, (66, 532), 'not the plain-text note.', 24, PINK)
            self.footer(draw, 'Illustration · container framing and placement are simplified')

        elif stage == 'pixel':
            self.header(draw, '03', 'ONE RGB CHANNEL', 'Keep seven bits. Replace one.')
            point = self.points[0]
            changed = progress >= .42
            image = self.after if changed else self.cover
            patch = image.crop((point[0] - 4, point[1] - 4, point[0] + 5, point[1] + 5))
            canvas.paste(patch.resize((324, 324), Image.Resampling.NEAREST), (44, 156))
            draw = ImageDraw.Draw(canvas)
            # Grid lines and a border identify one enlarged source pixel
            for line in range(10):
                draw.line((44 + line * 36, 156, 44 + line * 36, 480), fill=LINE, width=1)
                draw.line((44, 156 + line * 36, 368, 156 + line * 36), fill=LINE, width=1)
            draw.rectangle((188, 300, 224, 336), outline=PINK, width=4)
            self.text(draw, (44, 495), 'one pixel, enlarged', 16, MUTED)
            self.text(draw, (422, 157), f'RED  {self.before_red} → {self.after_red}', 20, BLUE)
            self.text(draw, (422, 204), 'BEFORE', 16, MUTED)
            self.text(draw, (422, 306), 'AFTER', 16, MUTED)
            for row, value in enumerate((self.before_red, self.after_red if changed else self.before_red)):
                for index, bit in enumerate(f'{value:08b}'):
                    x, y = 422 + index * 61, 238 + row * 102
                    color = PINK if index == 7 else WHITE
                    self.panel(draw, (x, y, x + 49, y + 51), '#171b26', PINK if index == 7 else LINE, 3)
                    self.text(draw, (x + 14, y + 8), bit, 24, color)
            self.text(draw, (422, 416), 'these 7 stay put', 16, MUTED)
            draw.line((422, 407, 837, 407), fill=BLUE, width=2)
            self.text(draw, (868, 416), 'LSB', 16, PINK)
            self.panel(draw, (44, 540, 916, 595))
            self.text(draw, (62, 554), 'example byte A7 / LSB-first', 16, MUTED)
            for index, bit in enumerate(EXAMPLE_BITS):
                self.text(draw, (581 + index * 40, 550), str(bit), 24, PINK if index == 0 else BLUE)
            if .08 <= progress < .42:
                travel = (progress - .08) / .34
                x, y = 590 + 280 * travel, 516 - 204 * travel - 80 * math.sin(travel * math.pi)
                draw.ellipse((x, y, x + 36, y + 36), fill=PINK)
                self.text(draw, (x + 10, y + 3), '1', 20, BACKGROUND)
            self.footer(draw, f'One selected channel: {self.before_red} → {self.after_red}. A difference of 1 / 255.')

        elif stage == 'scatter':
            self.header(draw, '04', 'BACK TO THE IMAGE', 'Tiny writes. Scattered locations.')
            for index, (x, y) in enumerate(self.points):
                if progress * 8 >= index:
                    radius = 10 + 7 * math.sin((progress * 5 - index / 8) * math.pi) ** 2
                    center = (BOX[0] + x, BOX[1] + y)
                    draw.ellipse((center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius), outline=PINK, width=3)
            self.panel(draw, (60, 524, 618, 579))
            self.text(draw, (78, 539), 'Selected RGB bytes. Not a left-to-right scan.', 16)
            self.footer(draw, 'Markers exaggerated for visibility · placement shown schematically')

        else:
            self.header(draw, '05', 'HIDDEN IN PLAIN SIGHT', 'Different bits. Same night sky.')
            # Both labeled halves remain visible while the comparison settles at center
            split = round(892 * (.5 + .28 * math.sin(progress * math.pi * 2) * (1 - progress)))
            canvas.paste(self.after, BOX[:2])
            if split:
                canvas.paste(self.cover.crop((0, 0, split, 490)), BOX[:2])
            draw = ImageDraw.Draw(canvas)
            x = BOX[0] + split
            if 0 < split < 892:
                draw.line((x, 110, x, 600), fill=PINK, width=3)
                draw.ellipse((x - 15, 340, x + 15, 370), fill=PINK)
            self.panel(draw, (58, 130, 198, 172))
            self.text(draw, (76, 140), 'cover', 18)
            self.panel(draw, (624, 130, 900, 172))
            self.text(draw, (642, 140), 'with hidden bits', 18, PINK)
            self.panel(draw, (58, 518, 716, 578))
            self.text(draw, (78, 535), 'look closer. much closer.', 24)
            self.footer(draw, f'{self.changed} channel values changed in this example. The skyline barely notices.')

        return canvas

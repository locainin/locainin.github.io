from functools import lru_cache
import math
import subprocess

from PIL import Image, ImageDraw, ImageFont

DURATION = 14
SIZE = (720, 480)
BACKGROUND = '#0c0e14'
SURFACE = '#151a25'
INK = '#e8eaf0'
MUTED = '#b6bdce'
METADATA = '#9ea8bf'
LINE = '#303646'
BLUE = '#a9b9ff'
TEAL = '#7bd9c8'
AMBER = '#edbd75'

STAGES = (
    ('select', 0, 3),
    ('inspect', 3, 5.5),
    ('handoff', 5.5, 8.3),
    ('load', 8.3, 11.1),
    ('verify', 11.1, DURATION),
)

STEP_LABELS = ('TARGET', 'PE / ARCH', 'STAGE', 'LOAD', 'VERIFY')
STEP_CENTERS = (48, 178, 310, 440, 570)
TITLES = {
    'select': 'Pick a live Proton target',
    'inspect': 'Check the DLL and process architecture',
    'handoff': 'Stage a private request',
    'load': 'Load inside the matched process',
    'verify': 'Verify the exact module path',
}


def stage_at(seconds):
    time = max(0, min(DURATION, seconds))
    for name, start, end in STAGES:
        if time < end or name == 'verify':
            return name, (time - start) / (end - start)


def smooth(value):
    value = max(0, min(1, value))
    return value * value * (3 - 2 * value)


@lru_cache(maxsize=None)
def font(family, size, bold=False):
    style = 'Bold' if bold else 'Regular'
    path = subprocess.check_output(
        ['fc-match', '-f', '%{file}', f'{family}:style={style}'],
        text=True,
    ).strip()
    return ImageFont.truetype(path, size)


def write(draw, xy, value, size=20, color=INK, *, mono=False, bold=False, anchor=None):
    family = 'JetBrains Mono' if mono else 'Noto Sans'
    draw.text(xy, value, font=font(family, size, bold), fill=color, anchor=anchor)


def draw_file(draw, x, y, width=48, height=54, color=AMBER):
    fold = min(13, width // 3)
    draw.polygon(
        ((x, y), (x + width - fold, y), (x + width, y + fold),
         (x + width, y + height), (x, y + height)),
        fill=SURFACE,
        outline=color,
    )
    draw.line((x + width - fold, y, x + width - fold, y + fold, x + width, y + fold), fill=color, width=2)
    draw.line((x + 9, y + height - 15, x + width - 9, y + height - 15), fill=color, width=2)


def draw_check(draw, x, y, color=TEAL):
    points = ((x, y + 7), (x + 7, y + 14), (x + 22, y - 3))
    draw.line(points, fill=color, width=3)


def draw_arrow(draw, start, end, color=BLUE, width=2):
    draw.line((start, end), fill=color, width=width)
    x1, y1 = start
    x2, y2 = end
    angle = math.atan2(y2 - y1, x2 - x1)
    size = 10
    left = (x2 - size * math.cos(angle - .5), y2 - size * math.sin(angle - .5))
    right = (x2 - size * math.cos(angle + .5), y2 - size * math.sin(angle + .5))
    draw.polygon((end, left, right), fill=color)


def draw_dashed(draw, start, end, color=LINE, dash=8, gap=7, width=2):
    length = math.dist(start, end)
    dx = (end[0] - start[0]) / length
    dy = (end[1] - start[1]) / length
    offset = 0
    while offset < length:
        finish = min(length, offset + dash)
        draw.line(
            (start[0] + dx * offset, start[1] + dy * offset,
             start[0] + dx * finish, start[1] + dy * finish),
            fill=color,
            width=width,
        )
        offset += dash + gap


class WorkflowIllustration:
    def __init__(self):
        self.background = Image.new('RGB', SIZE, BACKGROUND)

    def header(self, canvas, stage, progress):
        draw = ImageDraw.Draw(canvas)
        index = next(i for i, (name, _, _) in enumerate(STAGES) if name == stage)

        # Plain type gives the illustration its identity without a product logo
        write(draw, (34, 20), 'ProtonInformer', 25, INK, bold=True)
        write(draw, (684, 27), 'WINE + PROTON', 18, METADATA, mono=True, anchor='ra')
        write(draw, (35, 54), 'WORKFLOW / ILLUSTRATION', 18, BLUE, mono=True)
        draw.line((34, 77, 686, 77), fill=LINE, width=1)
        write(draw, (34, 87), TITLES[stage], 29, INK, bold=True)

        # A small progress rail keeps the step order visible as the scene changes
        rail_y = 145
        for step, center in enumerate(STEP_CENTERS):
            if step < len(STEP_CENTERS) - 1:
                next_center = STEP_CENTERS[step + 1]
                active_part = smooth(progress) if step == index else (1 if step < index else 0)
                end_x = center + 11 + (next_center - center - 22) * active_part
                draw.line((center + 11, rail_y, end_x, rail_y), fill=BLUE if step <= index else LINE, width=2)
                if active_part < 1:
                    draw.line((end_x, rail_y, next_center - 10, rail_y), fill=LINE, width=2)

            color = BLUE if step == index else TEAL if step < index else METADATA
            radius = 6 if step == index else 4
            draw.ellipse((center - radius, rail_y - radius, center + radius, rail_y + radius), fill=color)
            write(draw, (center, 157), STEP_LABELS[step], 18, color, mono=True, anchor='ma')

        draw.line((34, 184, 686, 184), fill=LINE, width=1)
        draw.line((34, 432, 686, 432), fill=LINE, width=1)
        write(draw, (684, 445), '14 SEC', 18, METADATA, mono=True, anchor='ra')

    def select(self, draw, progress):
        write(draw, (42, 193), 'DISCOVERED WINE / PROTON TARGETS', 18, METADATA, mono=True)
        write(draw, (50, 222), 'PROCESS', 18, METADATA, mono=True)
        write(draw, (285, 222), 'PID', 18, METADATA, mono=True)
        write(draw, (372, 222), 'RUNTIME', 18, METADATA, mono=True)

        rows = (
            ('launcher.exe', '24104', 'PROTON'),
            ('target.exe', '24108', 'PROTON'),
            ('explorer.exe', '23992', 'WINE'),
        )
        row_top = 239
        row_height = 43
        selected = 1
        y = row_top + selected * row_height
        draw.rectangle((38, y, 478, y + row_height - 2), fill=SURFACE)
        draw.rectangle((38, y, 42, y + row_height - 2), fill=BLUE)

        # The focus stroke travels through the candidates and settles on the game
        scan_y = row_top + row_height / 2 + smooth(progress) * row_height
        draw.line((44, scan_y, 468, scan_y), fill=BLUE, width=2)
        for index, (process, pid, runtime) in enumerate(rows):
            text_y = row_top + index * row_height + 9
            color = INK if index == selected else MUTED
            write(draw, (51, text_y), process, 20, color, mono=True)
            write(draw, (285, text_y), pid, 19, color, mono=True)
            write(draw, (372, text_y), runtime, 18, BLUE if index == selected else METADATA, mono=True)
            if index < len(rows) - 1:
                draw.line((45, row_top + (index + 1) * row_height, 478, row_top + (index + 1) * row_height), fill=LINE, width=1)

        draw.line((496, 194, 496, 378), fill=LINE, width=1)
        write(draw, (518, 199), 'APP ID', 18, METADATA, mono=True)
        write(draw, (518, 219), '311210', 27, INK, mono=True)
        write(draw, (518, 266), 'GUEST PROCESS', 18, METADATA, mono=True)
        write(draw, (518, 287), 'target.exe', 20, INK, mono=True)
        write(draw, (518, 333), 'ARCHITECTURE', 18, METADATA, mono=True)
        write(draw, (518, 354), 'x86-64', 22, BLUE, mono=True)
        write(draw, (42, 375), 'Exact target identity selected', 18, TEAL)

    def inspect(self, draw, progress):
        write(draw, (42, 198), 'SOURCE DLL', 18, METADATA, mono=True)
        draw_file(draw, 58, 230, 65, 78)
        write(draw, (42, 322), 'mod.dll', 25, INK, mono=True, bold=True)
        write(draw, (42, 354), 'WINDOWS PE', 18, AMBER, mono=True)

        draw.line((160, 273, 249, 273), fill=LINE, width=2)
        dot_x = 160 + 89 * smooth(progress)
        draw.ellipse((dot_x - 5, 268, dot_x + 5, 278), fill=AMBER)
        draw_arrow(draw, (250, 273), (274, 273), BLUE, 2)

        fields = (
            ('SIGNATURE', 'PE'),
            ('MACHINE', 'AMD64'),
            ('IMAGE TYPE', 'DLL'),
            ('TARGET ARCH', 'x86-64'),
        )
        active = min(len(fields) - 1, int(progress * len(fields)))
        top = 203
        for index, (label, value) in enumerate(fields):
            y = top + index * 41
            if index == active:
                draw.rectangle((282, y - 2, 679, y + 34), fill=SURFACE)
                draw.rectangle((282, y - 2, 286, y + 34), fill=BLUE)
            write(draw, (300, y + 3), label, 18, METADATA, mono=True)
            write(draw, (545, y), value, 23, INK if index != active else BLUE, mono=True, bold=True)
            if index < len(fields) - 1:
                draw.line((292, y + 39, 679, y + 39), fill=LINE, width=1)

        draw.line((42, 381, 679, 381), fill=LINE, width=1)
        write(draw, (47, 394), 'DLL   x86-64', 21, INK, mono=True)
        write(draw, (313, 394), '=', 23, METADATA, mono=True)
        write(draw, (365, 394), 'PROCESS   x86-64', 21, INK, mono=True)
        if progress > .72:
            draw_check(draw, 646, 402, TEAL)

    def handoff(self, draw, progress):
        split = 362
        draw.line((split, 194, split, 406), fill=BLUE, width=2)
        write(draw, (42, 195), 'LINUX CONTROLLER', 18, BLUE, mono=True)
        write(draw, (389, 195), 'WINE PREFIX · 311210', 18, BLUE, mono=True)

        write(draw, (44, 236), 'PRIVATE RUN DIRECTORY', 18, METADATA, mono=True)
        draw.line((44, 266, 332, 266), fill=LINE, width=1)
        draw_file(draw, 50, 282, 42, 48, BLUE)
        write(draw, (108, 290), 'request.json', 20, INK, mono=True)
        draw_file(draw, 50, 343, 42, 48, AMBER)
        write(draw, (108, 351), 'mod.dll', 21, AMBER, mono=True)

        write(draw, (389, 236), 'MATCHED X64 HELPER', 18, METADATA, mono=True)
        write(draw, (389, 276), 'proton-informer-', 18, INK, mono=True)
        write(draw, (389, 301), 'win-helper.exe', 18, INK, mono=True)
        write(draw, (389, 365), 'Exact process match', 18, MUTED)

        # The staged DLL crosses the Wine path map toward the matching helper
        draw_dashed(draw, (118, 333), (579, 333), LINE, 7, 7, 2)
        t = smooth(progress)
        packet_x = 118 + 400 * t
        packet_y = 320
        draw.rectangle((packet_x, packet_y, packet_x + 54, packet_y + 28), fill=AMBER)
        write(draw, (packet_x + 27, packet_y + 4), 'DLL', 18, BACKGROUND, mono=True, bold=True, anchor='ma')
        write(draw, (348, 382), 'WINE PATH MAP', 18, METADATA, mono=True, anchor='ra')

    def load(self, draw, progress):
        write(draw, (42, 198), 'MATCHED WINDOWS HELPER', 18, METADATA, mono=True)
        write(draw, (42, 229), 'proton-informer-', 18, INK, mono=True)
        write(draw, (42, 253), 'win-helper.exe', 18, INK, mono=True)
        write(draw, (42, 302), 'LoadLibraryW', 24, BLUE, mono=True, bold=True)
        write(draw, (42, 370), 'REMOTE LOAD THREAD', 18, METADATA, mono=True)

        draw.line((322, 196, 322, 405), fill=LINE, width=1)
        write(draw, (349, 198), 'TARGET PROCESS', 18, METADATA, mono=True)
        write(draw, (349, 224), 'target.exe', 23, INK, mono=True, bold=True)
        draw.line((349, 257, 682, 257), fill=LINE, width=1)

        module_rows = (
            ('kernel32.dll', 270),
            ('d3d11.dll', 306),
            ('winmm.dll', 342),
        )
        for name, y in module_rows:
            write(draw, (356, y), name, 19, MUTED, mono=True)
            draw.line((350, y + 29, 682, y + 29), fill=LINE, width=1)

        # The new slot stays separate while the payload follows the load path
        if progress > .68:
            draw.rectangle((349, 378, 682, 407), fill=SURFACE)
            draw.rectangle((349, 378, 353, 407), fill=AMBER)
        else:
            draw.line((349, 378, 682, 378), fill=LINE, width=1)
            draw.line((349, 407, 682, 407), fill=LINE, width=1)

        draw_arrow(draw, (220, 320), (405, 390), BLUE, 2)
        if progress < .72:
            travel = smooth(progress)
            packet_x = 211 + 104 * travel
            packet_y = 295 + 70 * travel
            draw_file(draw, packet_x, packet_y, 38, 46, AMBER)
        if progress > .72:
            write(draw, (420, 379), '+ mod.dll', 20, AMBER, mono=True, bold=True)

    def verify(self, draw, progress):
        write(draw, (42, 195), 'BEFORE   142 MODULES', 18, METADATA, mono=True)
        write(draw, (385, 195), 'AFTER   143 MODULES', 18, METADATA, mono=True)
        draw.line((360, 194, 360, 318), fill=LINE, width=1)

        before = ('kernel32.dll', 'd3d11.dll', 'winmm.dll')
        after = (*before, '+ mod.dll')
        # Existing modules stay visible when the new library joins the process
        for column, modules in ((45, before), (387, after)):
            for index, name in enumerate(modules):
                y = 222 + index * 27
                color = AMBER if name.startswith('+') else MUTED if column == 45 else INK
                write(draw, (column, y), name, 19, color, mono=True)
                if index < len(modules) - 1:
                    draw.line((column - 2, y + 24, column + 292, y + 24), fill=LINE, width=1)

        draw.line((42, 329, 679, 329), fill=TEAL if progress > .7 else LINE, width=2)
        write(draw, (45, 338), 'EXPECTED', 18, METADATA, mono=True)
        write(draw, (145, 338), r'C:\users\steamuser\Temp\proton\run\mod.dll', 18, INK, mono=True)
        write(draw, (45, 369), 'LOADED  ', 18, METADATA, mono=True)
        write(draw, (145, 369), r'C:\users\steamuser\Temp\proton\run\mod.dll', 18, INK, mono=True)
        if progress > .68:
            draw_check(draw, 650, 402, TEAL)
        if progress > .65:
            write(draw, (482, 398), 'EXACT PATH MATCH', 18, TEAL, mono=True, anchor='ma')

    def frame(self, seconds):
        stage, progress = stage_at(seconds)
        canvas = self.background.copy()
        draw = ImageDraw.Draw(canvas)
        self.header(canvas, stage, progress)
        render_stage = {
            'select': self.select,
            'inspect': self.inspect,
            'handoff': self.handoff,
            'load': self.load,
            'verify': self.verify,
        }[stage]
        render_stage(draw, progress)

        # Both ends approach the same dark canvas for a softer repeating loop
        edge_distance = min(max(seconds, 0), max(0, DURATION - seconds))
        if edge_distance < .6:
            amount = smooth(edge_distance / .6)
            canvas = Image.blend(self.background, canvas, amount)
        return canvas

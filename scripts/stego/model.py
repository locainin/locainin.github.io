# This model illustrates a container byte rather than encrypting a real payload
DURATION = 18
EXAMPLE_BYTE = 0xA7
EXAMPLE_BITS = tuple((EXAMPLE_BYTE >> offset) & 1 for offset in range(8))
STAGES = (('note', 0, 3), ('encrypt', 3, 6), ('pixel', 6, 12), ('scatter', 12, 15), ('reveal', 15, DURATION))


def replace_lsb(channel, bit):
    return (channel & 0xFE) | bit


def stage_at(seconds):
    time = max(0, min(DURATION, seconds))
    for name, start, end in STAGES:
        if time < end or name == 'reveal':
            return name, (time - start) / (end - start)

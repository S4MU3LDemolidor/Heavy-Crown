import sys
sys.path.insert(0, 'tools/leveldraft')
from draft import Screen, emit

def walls(s):
    s.fill(0, 0, 1, 33, '#')
    s.fill(58, 0, 59, 33, '#')
    return s

def bell(s, x, y, w=4, h=3):
    s.fill(x, y, x + w - 1, y + h - 1, 'B')

def shaft(s, y0, y1):
    """The bell shaft: walls at cols 50 and 54, ladder at col 52."""
    s.fill(50, y0, 50, y1, '#')
    s.fill(54, y0, 54, y1, '#')
    s.fill(51, y0, 53, y1, ' ')
    s.fill(52, y0, 52, y1, 'H')

# ---------- b3 (bottom): the hall of bells, the pickaxe, the Bell Door ----------
b3 = walls(Screen(' '))
b3.fill(8, 2, 44, 14, '.')           # tall windows onto the sunset
b3.fill(30, 15, 44, 24, '.')
b3.fill(36, 30, 49, 30, '#')         # E (from the cistern)
shaft(b3, 0, 29)
b3.fill(51, 30, 57, 30, '#')         # shaft floor
b3.fill(50, 27, 50, 29, 'D')         # the Bell Door
b3.fill(55, 0, 57, 29, '#')
b3.fill(26, 25, 32, 25, '#')
bell(b3, 16, 20)                     # a bell to stand on
b3.fill(6, 15, 12, 15, '#')
b3.fill(2, 20, 5, 20, '#')           # pickaxe ledge
b3.put(3, 19, 'a')
b3.fill(18, 10, 24, 10, '#')
b3.fill(30, 5, 37, 5, '#')           # exit up

# ---------- b2: the cracked chimney ----------
b2 = walls(Screen(' '))
b2.fill(14, 4, 40, 20, '.')
shaft(b2, 0, 33)
b2.fill(55, 0, 57, 33, '#')
b2.fill(40, 33, 46, 33, '#')
b2.fill(30, 28, 36, 28, '#')
bell(b2, 20, 23)
b2.fill(28, 18, 34, 18, '#')
b2.fill(38, 13, 44, 13, '#')
b2.fill(28, 8, 34, 8, '#')
b2.fill(38, 3, 44, 3, '#')           # exit up
# the hidden chimney on the left, sealed by cracked stone
b2.fill(2, 0, 2, 33, '#')
b2.fill(8, 0, 9, 29, '#')
b2.fill(8, 30, 9, 32, 'C')
b2.fill(3, 33, 9, 33, '#')
b2.fill(3, 27, 4, 27, '#')
b2.fill(6, 21, 7, 21, '#')
b2.fill(3, 15, 4, 15, '#')
b2.fill(6, 9, 7, 9, '#')
b2.fill(3, 3, 4, 3, '#')
b2.fill(10, 33, 16, 33, '#')         # ledge outside the chimney mouth

# ---------- b1: the Bell Key and the idol ----------
b1 = walls(Screen(' '))
b1.fill(14, 4, 40, 18, '.')
b1.fill(50, 21, 50, 33, '#')         # shaft walls; the ladder runs up to row 20
b1.fill(54, 17, 54, 33, '#')
b1.fill(51, 17, 53, 17, '#')         # shaft cap
b1.fill(51, 18, 53, 33, ' ')
b1.fill(52, 20, 52, 33, 'H')
b1.fill(55, 13, 57, 33, '#')
b1.fill(30, 31, 36, 31, '#')         # from below
b1.fill(40, 26, 46, 26, '#')
b1.fill(44, 21, 49, 21, '#')         # ledge at the top of the bell shaft
b1.fill(34, 16, 40, 16, '#')
b1.fill(44, 11, 50, 11, '#')
b1.fill(52, 12, 57, 12, '#')         # the idol's nook
b1.fill(51, 8, 57, 8, '#')
b1.put(55, 11, 'i')
b1.fill(34, 6, 40, 6, '#')
b1.fill(24, 1, 30, 1, '#')           # exit up
# side trip to the Bell Key
b1.fill(20, 26, 26, 26, '#')
bell(b1, 8, 21, 5, 3)
b1.fill(2, 16, 5, 16, '#')
b1.put(3, 15, 'k')
b1.put(23, 25, 'c')

# ---------- b0 (top): the Scepter, the Lantern ----------
b0 = walls(Screen(' '))
b0.fill(10, 8, 40, 26, '.')
b0.fill(32, 31, 38, 31, '#')         # from below
b0.fill(42, 26, 48, 26, '#')
b0.fill(32, 21, 38, 21, '#')
bell(b0, 22, 17, 5, 3)
b0.fill(12, 12, 18, 12, '#')
b0.fill(2, 12, 7, 12, '#')           # the Scepter's ledge
b0.put(4, 11, 's')
b0.put(6, 10, 'n')                   # Maren: I found the Scepter
b0.fill(22, 7, 28, 7, '#')
b0.put(25, 6, 'r')                   # ruby
b0.fill(34, 2, 57, 2, '#')           # top: into the dark
b0.put(50, 1, 'l')                   # Maren's lantern, in the last light

HEADER = """import type { LevelDef } from '../../game/level';

/** Level III — The Bell Hall (spec section 9). Screens listed top to bottom. */
export const L3: LevelDef = {
  id: 3,
  theme: 'bells',
  legend: {
    B: { kind: 'object', object: 'bell' },
    D: { kind: 'object', object: 'gate', props: { key: 'bell_key' } },
    a: { kind: 'item', item: 'pickaxe' },
    k: { kind: 'item', item: 'bell_key' },
    i: { kind: 'item', item: 'idol' },
    s: { kind: 'item', item: 'scepter' },
    l: { kind: 'item', item: 'lantern' },
    r: { kind: 'item', item: 'ruby' },
    c: { kind: 'item', item: 'coin_pouch' },
    n: { kind: 'object', object: 'note', props: { id: 'note3' } },
  },
"""
with open('src/content/levels/l3-bell-hall.ts', 'w') as f:
    f.write(HEADER + emit('screens', [b0, b1, b2, b3]) + '\n};\n')

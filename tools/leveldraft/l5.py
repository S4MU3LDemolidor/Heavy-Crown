import sys
sys.path.insert(0, 'tools/leveldraft')
from draft import Screen, emit

def walls(s):
    s.fill(0, 0, 1, 33, '#')
    s.fill(58, 0, 59, 33, '#')
    return s

# Every step on the summit route is 5 tiles up: climbable at 7 stones, not at 11 (spec section 9).

# ---------- e3 (bottom): the cold begins ----------
e3 = walls(Screen('.'))
e3.fill(2, 33, 34, 33, '#')          # a floor of old snow
e3.fill(54, 33, 57, 33, '#')
e3.fill(36, 30, 42, 30, '#')         # from the dark
e3.put(39, 29, 'p')                  # crampons
e3.put(41, 29, 'R')                  # rope coil #2
e3.fill(46, 25, 52, 25, '#')
e3.fill(36, 20, 42, 20, 'i')         # ice
e3.fill(26, 15, 32, 15, '#')
e3.fill(36, 10, 42, 10, 'i')
e3.fill(46, 5, 52, 5, '#')
e3.put(46, 4, 'h')                   # rope hook: a ladder down the cold shaft
e3.fill(36, 0, 42, 0, '#')           # exit up
e3.fill(2, 20, 12, 32, ' ')          # a ruined room with its back wall
e3.fill(2, 19, 12, 19, '#')
e3.put(8, 32, 'c')

# ---------- e2: the cloak, and the first wind ----------
e2 = walls(Screen('.'))
e2.fill(26, 29, 32, 29, '#')
e2.fill(36, 24, 42, 24, '#')
e2.put(39, 23, 'f')                  # the fur cloak
e2.fill(46, 19, 52, 19, 'i')
e2.fill(36, 14, 42, 14, '#')
e2.fill(26, 9, 32, 9, '#')
e2.put(32, 8, 'h')                   # rope hook
e2.fill(16, 4, 22, 4, 'i')           # exit up
e2.fill(2, 10, 8, 33, '#')           # the spire's flank

# ---------- e1: ice and wind ----------
e1 = walls(Screen('.'))
e1.fill(24, 33, 30, 33, '#')
e1.fill(34, 28, 40, 28, 'i')
e1.fill(44, 23, 50, 23, '#')
e1.fill(34, 18, 40, 18, '#')
e1.fill(24, 13, 30, 13, 'i')
e1.fill(14, 8, 20, 8, '#')
e1.fill(24, 3, 30, 3, '#')           # exit up
e1.fill(52, 6, 57, 33, '#')

# ---------- e0 (top): the summit ----------
e0 = walls(Screen('.'))
e0.fill(0, 0, 1, 20, '.')
e0.fill(58, 0, 59, 20, '.')
e0.fill(34, 32, 40, 32, '#')
e0.fill(44, 27, 50, 27, '#')
e0.fill(34, 22, 40, 22, 'i')
e0.fill(46, 17, 52, 17, '#')
e0.fill(50, 12, 56, 12, '#')
e0.fill(14, 7, 46, 7, '#')           # the summit
e0.fill(18, 8, 42, 10, '#')
e0.fill(22, 11, 38, 12, '#')
e0.put(28, 6, 'A')                   # the altar and the crown
e0.put(33, 6, 'n')                   # Maren's scarf
e0.put(44, 6, 'h')                   # rope hook at the summit's edge

HEADER = """import type { LevelDef } from '../../game/level';

/** Level V — The Frozen Spire (spec section 9). Screens listed top to bottom. */
export const L5: LevelDef = {
  id: 5,
  theme: 'frozen',
  legend: {
    p: { kind: 'item', item: 'crampons' },
    R: { kind: 'item', item: 'rope' },
    f: { kind: 'item', item: 'fur_cloak' },
    c: { kind: 'item', item: 'coin_pouch' },
    h: { kind: 'object', object: 'rope_hook' },
    A: { kind: 'object', object: 'altar' },
    n: { kind: 'object', object: 'note', props: { id: 'scarf' } },
  },
  wind: [
    { screen: 1, dir: -1 },
    { screen: 2, dir: 1 },
  ],
"""
with open('src/content/levels/l5-frozen-spire.ts', 'w') as f:
    f.write(HEADER + emit('screens', [e0, e1, e2, e3]) + '\n};\n')

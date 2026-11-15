import sys
sys.path.insert(0, 'tools/leveldraft')
from draft import Screen, emit

def walls(s):
    s.fill(0, 0, 1, 33, '#')
    s.fill(58, 0, 59, 33, '#')
    return s

# ---------- d2 (bottom): into the dark, the map ----------
d2 = walls(Screen(' '))
d2.fill(26, 31, 32, 31, '#')         # from the bell hall
d2.fill(14, 26, 20, 26, '#')
d2.fill(4, 21, 10, 21, '#')
d2.fill(14, 16, 20, 16, '#')
d2.fill(26, 11, 32, 11, '#')
d2.fill(36, 16, 42, 16, '#')         # side ledge with Maren's map
d2.put(39, 15, 'm')
d2.fill(38, 6, 44, 6, '#')
d2.fill(48, 1, 54, 1, '#')           # exit up
d2.put(6, 20, 'c')
d2.fill(46, 20, 57, 33, '#')         # solid rock to the right

# ---------- d1: the bone key ----------
d1 = walls(Screen(' '))
d1.fill(40, 31, 46, 31, '#')         # from below
d1.fill(50, 26, 56, 26, '#')
d1.fill(40, 21, 46, 21, '#')
d1.fill(28, 16, 34, 16, '#')
d1.fill(16, 11, 22, 11, '#')
d1.put(19, 10, 'k')                  # the Bone Key
d1.fill(4, 6, 10, 6, '#')
d1.fill(14, 1, 20, 1, '#')           # exit up
d1.fill(2, 22, 12, 33, '#')          # bone heaps (solid)
d1.put(8, 21, 'r')                   # a ruby among the bones

# ---------- d0 (top): the ossuary and the Seal ----------
d0 = walls(Screen(' '))
d0.fill(22, 31, 28, 31, '#')         # from below
d0.fill(32, 26, 57, 26, '#')         # floor towards the ossuary
d0.fill(39, 19, 57, 19, '#')         # ossuary ceiling
d0.fill(44, 20, 44, 25, '#')
d0.fill(44, 23, 44, 25, 'O')         # the ossuary door
d0.fill(44, 20, 44, 22, '#')
d0.put(52, 25, 's')                  # the Seal
d0.fill(22, 21, 28, 21, '#')
d0.fill(10, 16, 16, 16, '#')
d0.fill(22, 11, 28, 11, '#')
d0.fill(34, 6, 40, 6, '#')
d0.fill(44, 1, 50, 1, '#')           # exit up to the spire

HEADER = """import type { LevelDef } from '../../game/level';

/** Level IV — The Lightless Floors (spec section 9). Screens listed top to bottom. */
export const L4: LevelDef = {
  id: 4,
  theme: 'dark',
  legend: {
    m: { kind: 'item', item: 'map' },
    k: { kind: 'item', item: 'bone_key' },
    O: { kind: 'object', object: 'gate', props: { key: 'bone_key' } },
    s: { kind: 'item', item: 'seal' },
    r: { kind: 'item', item: 'ruby' },
    c: { kind: 'item', item: 'coin_pouch' },
  },
"""
with open('src/content/levels/l4-lightless-floors.ts', 'w') as f:
    f.write(HEADER + emit('screens', [d0, d1, d2]) + '\n};\n')

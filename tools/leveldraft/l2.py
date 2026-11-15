import sys
sys.path.insert(0, 'tools/leveldraft')
from draft import Screen, emit

def walls(s):
    s.fill(0, 0, 1, 33, '#')
    s.fill(58, 0, 59, 33, '#')
    return s

# ---------- t3 (bottom): the pool and the plank bridge ----------
t3 = walls(Screen(' '))
t3.fill(28, 0, 40, 10, '.')          # a broken window high up
t3.fill(44, 3, 55, 12, '.')
t3.fill(2, 31, 20, 33, '#')          # pool floor
t3.fill(2, 28, 20, 30, '~')          # the pool
t3.fill(21, 28, 21, 33, '#')         # pool lip
t3.fill(40, 31, 47, 31, '#')         # E1 (from the level I exit)
t3.fill(50, 26, 56, 26, '#')         # E2
t3.fill(38, 21, 45, 21, '#')         # E3
t3.fill(28, 17, 34, 17, '#')         # E4
t3.fill(13, 17, 27, 17, '=')         # hinged plank bridge over the pool
t3.fill(8, 17, 12, 17, '#')          # bridge landing
t3.fill(14, 12, 19, 12, '#')         # La
t3.fill(22, 7, 28, 7, '#')           # Lb
t3.fill(31, 2, 37, 2, '#')           # exit up (under the hole in the floor above)
t3.fill(14, 26, 19, 26, '#')         # out of the pool: P1
t3.fill(3, 22, 8, 22, '#')           # P2
t3.put(4, 27, 'n')                   # Maren: left my books by the water
t3.put(53, 25, 'c')

# ---------- t2: the counterweight puzzle ----------
t2 = walls(Screen(' '))
t2.fill(20, 0, 21, 14, '#')          # dividing wall (gap at rows 15–17)
t2.fill(20, 18, 21, 30, '#')
t2.fill(22, 31, 27, 31, '#')         # right room floor, with a hole above the climb from below
t2.fill(38, 31, 57, 31, '#')
t2.fill(22, 26, 27, 26, '#')         # the stone's ledge
t2.put(24, 25, 's')
t2.put(42, 30, 'p')                  # pressure plate
t2.fill(50, 26, 56, 26, '#')         # R1
t2.fill(41, 22, 47, 22, '#')         # R2
t2.fill(22, 18, 38, 18, '#')         # corridor floor
t2.fill(10, 18, 19, 18, '#')         # continues into the left side
t2.fill(22, 2, 38, 14, '#')          # mass above the corridor
t2.fill(39, 2, 57, 13, '#')          # right room ceiling
t2.fill(33, 15, 33, 17, 'P')         # plate gate
t2.fill(2, 13, 8, 13, '#')           # L2 (spring boots)
t2.put(5, 12, 'b')
t2.fill(11, 8, 17, 8, '#')           # L3
t2.fill(2, 3, 8, 3, '#')             # L4 (exit up)
t2.fill(40, 3, 56, 12, '#')

# ---------- t1: the long climb, and the feather ----------
t1 = walls(Screen(' '))
t1.fill(24, 8, 36, 16, '.')          # windows onto the flooded shaft
t1.fill(46, 22, 56, 30, '.')
t1.fill(10, 32, 16, 32, '#')
t1.fill(20, 27, 26, 27, '#')
t1.fill(30, 22, 36, 22, '#')
t1.put(33, 21, 'x')                  # silver chalice
t1.fill(40, 17, 46, 17, '#')
t1.fill(50, 12, 56, 12, '#')
t1.fill(38, 7, 44, 7, '#')
t1.put(41, 6, 'c')
t1.fill(26, 2, 33, 2, '#')           # exit up
# the feather alcove: under an overhang, reached by bouncing off the pillar
t1.fill(2, 12, 12, 13, '#')          # overhang
t1.fill(2, 18, 6, 18, '#')           # alcove floor
t1.put(4, 17, 'f')
t1.fill(13, 14, 14, 20, '#')         # bounce pillar
t1.fill(9, 24, 14, 24, '#')          # where you jump from

# ---------- t0 (top): the Orb shrine ----------
t0 = walls(Screen(' '))
t0.fill(20, 10, 38, 30, '.')         # the drowned shaft opens to the sky here
t0.fill(36, 31, 43, 31, '#')         # from below
t0.fill(46, 26, 52, 26, '#')
t0.fill(36, 21, 42, 21, '#')
t0.fill(46, 16, 52, 16, '#')
t0.fill(52, 11, 57, 11, '#')
t0.fill(40, 6, 48, 6, '#')           # landing
t0.fill(20, 6, 39, 6, '=')           # the long plank bridge to the shrine
t0.fill(2, 6, 19, 6, '#')            # shrine platform
t0.fill(2, 0, 19, 1, '#')            # shrine roof
t0.put(8, 5, 'o')                    # the Orb
t0.put(4, 5, 'c')
t0.fill(29, 1, 35, 1, '#')           # exit up to the bell hall

HEADER = """import type { LevelDef } from '../../game/level';

/** Level II — The Drowned Cistern (spec section 9). Screens listed top to bottom. */
export const L2: LevelDef = {
  id: 2,
  theme: 'cistern',
  legend: {
    s: { kind: 'item', item: 'stone' },
    p: { kind: 'object', object: 'plate', props: { link: 'cistern', need: 3 } },
    P: { kind: 'object', object: 'gate', props: { link: 'cistern' } },
    b: { kind: 'item', item: 'spring_boots' },
    f: { kind: 'item', item: 'feather_charm' },
    o: { kind: 'item', item: 'orb' },
    c: { kind: 'item', item: 'coin_pouch' },
    x: { kind: 'item', item: 'chalice' },
    n: { kind: 'object', object: 'note', props: { id: 'note2' } },
  },
"""
with open('src/content/levels/l2-drowned-cistern.ts', 'w') as f:
    f.write(HEADER + emit('screens', [t0, t1, t2, t3]) + '\n};\n')

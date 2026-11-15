import sys
sys.path.insert(0, 'tools/leveldraft')
from draft import Screen, emit

# ---------- screen 0: ruined courtyard at dusk (bottom) ----------
s0 = Screen('.')
s0.fill(0, 0, 3, 33, '#')            # left tower wall
s0.fill(4, 12, 13, 29, ' ')          # ruined room behind, left
s0.fill(4, 10, 9, 11, '#')           # broken lintel
s0.fill(55, 12, 59, 33, '#')         # right wall
s0.fill(57, 0, 59, 11, '#')          # its broken top
s0.fill(43, 16, 54, 29, ' ')         # right alcove interior
s0.fill(45, 15, 54, 15, '#')         # alcove roof
s0.fill(0, 30, 59, 33, '#')          # ground
s0.fill(21, 28, 27, 29, '#')         # rubble mound
s0.fill(22, 27, 25, 27, '#')
s0.fill(9, 26, 15, 26, '#')          # A
s0.fill(4, 21, 9, 22, '#')           # B
s0.fill(12, 16, 18, 16, '#')         # C
s0.fill(20, 10, 25, 10, '#')         # E
s0.fill(27, 7, 29, 15, '#')          # pillar (bounce wall, top is a foothold)
s0.fill(33, 3, 43, 3, '#')           # F
s0.fill(47, 22, 52, 22, '#')         # coin ledge
s0.put(50, 21, 'c')                  # coin pouch
s0.put(5, 29, '@')
s0.put(11, 28, 'n')                  # Maren's first note

# ---------- screen 1: the hall with the iron gate ----------
s1 = Screen(' ')
s1.fill(0, 0, 1, 33, '#')
s1.fill(58, 0, 59, 33, '#')
s1.fill(19, 0, 23, 33, '.')          # open channel (the long fall)
s1.fill(3, 24, 9, 30, '.')           # low window
s1.fill(26, 0, 50, 1, '.')           # high windows
s1.fill(46, 31, 54, 31, '#')         # G1
s1.fill(36, 26, 41, 26, '#')         # G2
s1.fill(24, 21, 30, 21, '#')         # H1
s1.fill(12, 16, 17, 16, '#')         # H2
s1.fill(2, 16, 7, 16, '#')           # H3 (rope alcove)
s1.put(4, 15, 'r')                   # rope coil
s1.fill(9, 11, 15, 11, '#')          # H4
s1.fill(2, 6, 6, 6, '#')             # key ledge
s1.put(4, 5, 'k')
s1.fill(23, 14, 30, 14, '#')         # H5 (across the channel)
s1.fill(37, 12, 57, 12, '#')         # gate corridor floor
s1.fill(37, 3, 51, 8, '#')           # solid stonework above the corridor (its top is the exit ledge)
s1.fill(46, 9, 46, 11, 'G')          # iron gate
s1.fill(55, 8, 57, 8, '#')           # tall room steps beyond the gate
s1.fill(52, 4, 54, 4, '#')
s1.put(37, 2, 'h')                   # rope hook (ladder hangs down col 36 to G2)

# ---------- screen 2: the collapsing arch (top of level I) ----------
s2 = Screen('.')
s2.fill(0, 0, 1, 33, '#')
s2.fill(58, 0, 59, 33, '#')
s2.fill(2, 14, 7, 33, '#')           # left arch pier
s2.fill(52, 20, 57, 33, '#')         # right pier (caps the tall room below)
s2.fill(44, 26, 51, 33, ' ')         # ruined room by the right pier
s2.fill(36, 31, 42, 31, '#')         # S2a
s2.fill(46, 25, 50, 25, '#')         # S2b
s2.fill(39, 15, 44, 15, '#')         # S2d
s2.fill(25, 12, 30, 12, '#')         # S2e (the long jump)
s2.fill(8, 8, 22, 9, '#')            # arch top (broken at the right)
s2.fill(8, 10, 10, 10, '#')
s2.fill(8, 11, 9, 11, '#')
s2.fill(8, 12, 8, 13, '#')
s2.fill(30, 3, 38, 3, '#')           # exit ledge

print(emit('screens', [s2, s1, s0]))

HEADER = """import type { LevelDef } from '../../game/level';

/** Level I — The Overgrown Base (spec section 9). Screens listed top to bottom. */
export const L1: LevelDef = {
  id: 1,
  theme: 'overgrown',
  legend: {
    c: { kind: 'item', item: 'coin_pouch' },
    r: { kind: 'item', item: 'rope' },
    k: { kind: 'item', item: 'iron_key' },
    G: { kind: 'object', object: 'gate', props: { key: 'iron_key' } },
    h: { kind: 'object', object: 'rope_hook' },
    n: { kind: 'object', object: 'note', props: { id: 'note1' } },
  },
"""
with open('src/content/levels/l1-overgrown-base.ts', 'w') as f:
    f.write(HEADER + emit('screens', [s2, s1, s0]) + '\n};\n')

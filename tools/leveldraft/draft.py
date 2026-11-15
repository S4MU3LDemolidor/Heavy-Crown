"""Level drafting helper: paint rectangles onto 60x34 screens and emit TypeScript rows."""
W, H = 60, 34

class Screen:
    def __init__(self, bg='.'):
        self.g = [[bg] * W for _ in range(H)]
    def fill(self, x0, y0, x1, y1, ch):
        for y in range(max(0, y0), min(H, y1 + 1)):
            for x in range(max(0, x0), min(W, x1 + 1)):
                self.g[y][x] = ch
        return self
    def put(self, x, y, ch):
        self.g[y][x] = ch
        return self
    def rows(self):
        return [''.join(r) for r in self.g]

def emit(name, screens):
    out = [f'  {name}: [']
    for s in screens:
        out.append('    [')
        for r in s.rows():
            out.append(f"      '{r}',")
        out.append('    ],')
    out.append('  ],')
    return '\n'.join(out)

import { describe, expect, it } from 'vitest';
import { ContentGate } from '../tools/vite/ignoreUnchanged';

describe('ContentGate (dev server: reload only on real edits)', () => {
  it('reports no change when the contents are identical (a metadata-only file event)', () => {
    const gate = new ContentGate();
    gate.remember('/p/src/a.ts', 'export const a = 1;');
    expect(gate.changed('/p/src/a.ts', 'export const a = 1;')).toBe(false);
  });

  it('reports a change when the contents differ, and remembers the new contents', () => {
    const gate = new ContentGate();
    gate.remember('/p/src/a.ts', 'export const a = 1;');
    expect(gate.changed('/p/src/a.ts', 'export const a = 2;')).toBe(true);
    expect(gate.changed('/p/src/a.ts', 'export const a = 2;')).toBe(false);
  });

  it('treats files it has never seen as changed', () => {
    const gate = new ContentGate();
    expect(gate.changed('/p/src/new.ts', 'x')).toBe(true);
    expect(gate.changed('/p/src/new.ts', 'x')).toBe(false);
  });

  it('ignores query strings on module ids', () => {
    const gate = new ContentGate();
    gate.remember('/p/src/a.ts?v=123', 'same');
    expect(gate.changed('/p/src/a.ts', 'same')).toBe(false);
  });
});

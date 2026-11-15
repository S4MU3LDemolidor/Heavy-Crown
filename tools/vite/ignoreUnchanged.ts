import type { Plugin } from 'vite';

/** Remembers each file's last known contents so file events can be checked against real edits. */
export class ContentGate {
  private readonly seen = new Map<string, string>();

  private key(id: string): string {
    return id.split('?')[0];
  }

  remember(id: string, contents: string): void {
    this.seen.set(this.key(id), contents);
  }

  /** True if `contents` differ from what was last seen (or the file is new); remembers them either way. */
  changed(id: string, contents: string): boolean {
    const k = this.key(id);
    const same = this.seen.get(k) === contents;
    this.seen.set(k, contents);
    return !same;
  }
}

/**
 * Dev server only: skip hot updates for file events that did not change a file's contents.
 *
 * On a Mac with iCloud Drive syncing Documents, iCloud tags files while it uploads them. The file
 * watcher reports those tags as changes, and without this plugin each one reloads the whole game.
 */
export function ignoreUnchangedFiles(): Plugin {
  const gate = new ContentGate();
  return {
    name: 'heavy-crown:ignore-unchanged-files',
    apply: 'serve',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/node_modules/')) gate.remember(id, code);
      return null;
    },
    async hotUpdate({ type, file, read }) {
      if (type !== 'update') return;
      const contents = await read();
      if (!gate.changed(file, contents)) return [];
    },
  };
}

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Normalize generator output without changing its contents. */
export function normalizeGeneratedApi() {
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.name.endsWith('.ts')) {
        const source = readFileSync(path, 'utf8');
        const normalized = `${source.replace(/\n+$/, '')}\n`;
        if (normalized !== source) writeFileSync(path, normalized);
      }
    }
  }
  visit('src/.generated/api');
}

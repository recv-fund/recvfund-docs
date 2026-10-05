import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
function pages(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory()
      ? pages(full)
      : entry.name.endsWith('.mdx')
        ? [full]
        : [];
  });
}

test('every source page is discoverable and Markdown links resolve locally', () => {
  const index = readFileSync(join(root, 'public/llms.txt'), 'utf8');
  const full = readFileSync(join(root, 'public/llms-full.txt'), 'utf8');
  for (const file of pages(join(root, 'content'))) {
    const path = file
      .slice(join(root, 'content').length + 1)
      .replace(/mdx$/, 'md');
    const text = readFileSync(join(root, 'public', path), 'utf8');
    assert.ok(index.includes(`https://docs.recv.fund/${path}`), path);
    assert.ok(full.includes(`Markdown: https://docs.recv.fund/${path}`), path);
    assert.ok(!text.startsWith('---\n'), 'front matter is omitted');
    for (const [, href] of text.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)) {
      assert.ok(!href.startsWith('/'), `Unresolved link in ${path}: ${href}`);
      const url = new URL(href, 'https://docs.recv.fund');
      if (url.origin !== 'https://docs.recv.fund') continue;
      assert.ok(
        existsSync(join(root, 'public', url.pathname)),
        `Missing target in ${path}: ${url.pathname}`,
      );
    }
  }
});

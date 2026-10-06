import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const content = join(root, 'content');
const output = join(root, 'out');
const origin = 'https://docs.recv.fund';

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const routes = files(content)
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => {
    const segments = relative(content, file)
      .replace(/\.mdx$/, '')
      .split(sep);
    if (segments.at(-1) === 'index') segments.pop();
    return segments.length ? `/${segments.join('/')}/` : '/';
  });
const robots = readFileSync(join(output, 'robots.txt'), 'utf8');
assert.match(robots, /User-Agent: \*\nAllow: \/\n/);
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
const sitemap = readFileSync(join(output, 'sitemap.xml'), 'utf8');
assert.match(
  sitemap,
  /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/,
);
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, url]) => url,
);
assert.deepEqual(
  urls.toSorted(),
  routes.map((route) => origin + route).toSorted(),
);
assert.equal(new Set(urls).size, urls.length, 'Sitemap has duplicate URLs');
for (const route of routes) {
  const html = readFileSync(join(output, route, 'index.html'), 'utf8');
  assert.ok(html.includes(`rel="canonical" href="${origin}${route}"`), route);
  assert.ok(html.includes('rel="describedby" href="/llms.txt"'), route);
  const alternate = html.match(/type="text\/markdown" href="([^"]+)"/);
  assert.ok(alternate, `${route} Markdown alternate`);
  const markdown = new URL(alternate[1]);
  assert.equal(markdown.origin, origin);
  assert.ok(existsSync(join(output, markdown.pathname)), markdown.pathname);
}
for (const file of ['llms.txt', 'llms-full.txt']) {
  const text = readFileSync(join(output, file), 'utf8');
  assert.ok(text.startsWith('# recv.fund'));
  for (const [, target] of text.matchAll(
    /\]\((https:\/\/docs\.recv\.fund\/[^)\s]+)\)/g,
  )) {
    const url = new URL(target);
    assert.ok(existsSync(join(output, url.pathname)), target);
  }
}
console.log(
  `Verified robots, sitemap, canonical URLs and agent exports for ${routes.length} pages.`,
);

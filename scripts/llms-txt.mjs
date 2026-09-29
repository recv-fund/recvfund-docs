/*
 * Writes public/llms.txt: one line per documentation page, grouped by
 * section, for language-model readers. The title and description come from
 * each page's front matter, the route from its path under content/.
 * Runs before `next build` (see package.json) so the file is exported with
 * the site; the generated file is also committed so any host serves it.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const contentDir = join(root, 'content');
const siteUrl = 'https://docs.recv.fund';

function listMdx(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listMdx(full);
    return entry.name.endsWith('.mdx') ? [full] : [];
  });
}

function frontMatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  const fields = {};
  if (!match) return fields;
  for (const line of match[1].split('\n')) {
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (value.startsWith('"') && value.endsWith('"'))
      value = value.slice(1, -1);
    fields[key] = value;
  }
  return fields;
}

function metaOrder(dir) {
  let source = '';
  try {
    source = readFileSync(join(dir, '_meta.ts'), 'utf8');
  } catch {
    return [];
  }
  return [...source.matchAll(/^\s*'?([a-z0-9-]+)'?:/gm)].map((m) => m[1]);
}

function metaIndex(file) {
  const parts = relative(contentDir, file)
    .replace(/\.mdx$/, '')
    .split(sep);
  const name = parts[parts.length - 1];
  const order = metaOrder(join(contentDir, ...parts.slice(0, -1)));
  const index = order.indexOf(name);
  return index === -1 ? order.length : index;
}

function routeOf(file) {
  const parts = relative(contentDir, file)
    .replace(/\.mdx$/, '')
    .split(sep);
  if (parts[parts.length - 1] === 'index') parts.pop();
  return parts.length === 0 ? '/' : `/${parts.join('/')}/`;
}

const sectionTitles = {
  '': 'Introduction',
  'deployment-guide': 'Deployment guide',
  'onboarding-guide': 'Onboarding guide',
  features: 'Features',
  'api-integration': 'API integration',
  support: 'Support',
};

const pages = listMdx(contentDir)
  .map((file) => {
    const fields = frontMatter(readFileSync(file, 'utf8'));
    const route = routeOf(file);
    const section = route.split('/')[1] ?? '';
    return {
      route,
      section: section in sectionTitles ? section : '',
      depth: route.split('/').length,
      order: metaIndex(file),
      title: fields.title ?? route,
      description: fields.description ?? '',
    };
  })
  .sort(
    (a, b) =>
      a.depth - b.depth ||
      a.route
        .slice(0, a.route.lastIndexOf('/', a.route.length - 2))
        .localeCompare(
          b.route.slice(0, b.route.lastIndexOf('/', b.route.length - 2)),
        ) ||
      a.order - b.order,
  );

const lines = [
  '# recv.fund documentation',
  '',
  '> Documentation for recv.fund, self-hosted, non-custodial stablecoin payment software for Solana and Robinhood Chain. Merchants run the server; funds settle to a wallet they register on-chain.',
  '',
];
for (const [section, title] of Object.entries(sectionTitles)) {
  const inSection = pages.filter((page) => page.section === section);
  if (inSection.length === 0) continue;
  lines.push(`## ${title}`, '');
  for (const page of inSection) {
    const suffix = page.description ? `: ${page.description}` : '';
    lines.push(`- [${page.title}](${siteUrl}${page.route})${suffix}`);
  }
  lines.push('');
}

writeFileSync(join(root, 'public', 'llms.txt'), `${lines.join('\n')}\n`);
console.log(`Wrote public/llms.txt with ${pages.length} pages.`);

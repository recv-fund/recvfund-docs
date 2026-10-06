/*
 * Exports the documentation index, full text and linked Markdown pages.
 * Runs before the static build so agents and browsers read the same content.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
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
  agents: 'AI agent guide',
};

const pages = listMdx(contentDir)
  .map((file) => {
    const source = readFileSync(file, 'utf8');
    const fields = frontMatter(source);
    const markdownPath = relative(contentDir, file).replace(/\.mdx$/, '.md');
    const markdown = source.replace(/^---\n[\s\S]*?\n---\n*/, '');
    const route = routeOf(file);
    const section = route.split('/')[1] ?? '';
    return {
      route,
      markdown,
      markdownPath,
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

const markdownRoutes = new Map(
  pages.map((page) => [page.route, page.markdownPath]),
);
for (const page of pages) {
  page.markdown = page.markdown.replace(
    /\[([^\]]+)\]\((\/[^)\s]*)\)/g,
    (_, label, href) => {
      const url = new URL(href, siteUrl);
      const route = url.pathname.endsWith('/')
        ? url.pathname
        : `${url.pathname}/`;
      const markdownPath = markdownRoutes.get(route);
      if (markdownPath) url.pathname = `/${markdownPath}`;
      return `[${label}](${url.href})`;
    },
  );
  mkdirSync(
    join(root, 'public', ...page.markdownPath.split('/').slice(0, -1)),
    { recursive: true },
  );
  writeFileSync(join(root, 'public', page.markdownPath), page.markdown);
}

const lines = [
  '# recv.fund documentation',
  '',
  '> Documentation for recv.fund, self-hosted, non-custodial stablecoin payment software for Solana and Robinhood Chain. Merchants run the server; funds settle to a wallet they register on-chain.',
  '',
  'Use the merchant installation origin for API requests. Inspect its /api/v1/integration/capabilities and /api-json. Project keys use API-Key; never use a dashboard JWT or installation admin key in its place. Never send credentials to docs.recv.fund.',
  '',
];
lines.push(
  '## Start here',
  '',
  '- [AI agent workflow](https://docs.recv.fund/agents/index.md): Setup, payments, verification and permissions.',
  '- [Complete documentation](https://docs.recv.fund/llms-full.txt): All pages in one text file.',
  '',
);
for (const [section, title] of Object.entries(sectionTitles)) {
  const inSection = pages.filter((page) => page.section === section);
  if (inSection.length === 0) continue;
  lines.push(`## ${title}`, '');
  for (const page of inSection) {
    const suffix = page.description ? `: ${page.description}` : '';
    lines.push(`- [${page.title}](${siteUrl}/${page.markdownPath})${suffix}`);
  }
  lines.push('');
}

writeFileSync(join(root, 'public', 'llms.txt'), `${lines.join('\n')}\n`);
console.log(`Wrote public/llms.txt with ${pages.length} pages.`);

writeFileSync(
  join(root, 'public', 'llms-full.txt'),
  '# recv.fund complete documentation\n\n' +
    pages
      .map(
        (page) =>
          `---\nSource: ${siteUrl}${page.route}\nMarkdown: ${siteUrl}/${page.markdownPath}\n\n${page.markdown}`,
      )
      .join('\n\n'),
);

writeFileSync(
  join(root, 'public', 'robots.txt'),
  `User-Agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
);
const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
writeFileSync(
  join(root, 'public', 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages
      .map(
        (page) =>
          `  <url><loc>${escapeXml(new URL(page.route, siteUrl).href)}</loc></url>`,
      )
      .join('\n') +
    '\n</urlset>\n',
);

import type { NextConfig } from 'next';
import nextra from 'nextra';

/*
 * The site is static: every page is rendered at build time into `out/` and
 * served from a static host. Search is Pagefind, indexed after `next build`
 * (see the build script) so the index reflects the exported HTML.
 */
const withNextra = nextra({
  defaultShowCopyCode: true,
  search: { codeblocks: false },
});

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default withNextra(nextConfig);

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import 'nextra-theme-docs/style.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.recv.fund'),
  title: {
    default: 'recv.fund documentation',
    template: '%s – recv.fund',
  },
  description:
    'Documentation for recv.fund, the self-hosted, non-custodial stablecoin payment server.',
};

const navbar = (
  <Navbar
    logo={<span className="wordmark">recv.fund</span>}
    projectLink="https://recv.fund"
    projectIcon={<span className="navbar-text-link">recv.fund</span>}
  />
);

const footer = (
  <Footer>
    <span>
      recv.fund is non-custodial software; merchants remain responsible for
      their own legal obligations.
    </span>
  </Footer>
);

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pageMap = await getPageMap();
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head faviconGlyph="r" />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={pageMap}
          editLink={null}
          feedback={{ content: null }}
          sidebar={{ defaultMenuCollapseLevel: 1, toggleButton: true }}
          toc={{ backToTop: 'Back to top' }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}

import { generateStaticParamsFor, importPage } from 'nextra/pages';
import { useMDXComponents as getMDXComponents } from '@/mdx-components';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

type PageProps = {
  params: Promise<{ mdxPath?: string[] }>;
};

export const generateStaticParams = generateStaticParamsFor('mdxPath');

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);
  const path = params.mdxPath?.join('/') || 'index';
  const markdownPath = existsSync(resolve('content', `${path}.mdx`))
    ? path
    : `${path}/index`;
  return {
    ...metadata,
    alternates: {
      types: {
        'text/markdown': `https://docs.recv.fund/${markdownPath}.md`,
      },
    },
  };
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props: PageProps) {
  const params = await props.params;
  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode,
  } = await importPage(params.mdxPath);
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';


export const baseOptions: BaseLayoutProps = {
  nav: {
    title: 'IngestX',
  },
  links: [
    {
      text: 'Docs',
      url: '/docs',
      active: 'nested-url',
    },
    {
      text: 'Demo',
      url: '/demo',
    },
  ],
  githubUrl: 'https://github.com/parallelbytes/ingestx',
};

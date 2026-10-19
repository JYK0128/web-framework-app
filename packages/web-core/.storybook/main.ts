import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';
import type { Alias } from 'vite';

const packageRoot = new URL('..', import.meta.url).pathname;

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)', '../stories/**/*.mdx'],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  framework: '@storybook/react-vite',
  docs: { autodocs: 'tag' },
  async viteFinal(viteConfig) {
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(tailwindcss());
    viteConfig.optimizeDeps ??= {};
    viteConfig.optimizeDeps.force = true;
    const aliases = viteConfig.resolve?.alias;
    viteConfig.resolve ??= {};
    const aliasEntries: Alias[] = [
      { find: /^#(?!prehydration\/)(.+)$/, replacement: `${packageRoot}src/$1` },
    ];
    if (Array.isArray(aliases)) {
      for (const alias of aliases as Alias[]) aliasEntries.push(alias);
    }
    viteConfig.resolve.alias = aliasEntries;

    return viteConfig;
  },
};

export default config;

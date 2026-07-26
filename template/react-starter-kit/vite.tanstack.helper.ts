import { glob } from 'node:fs/promises';
import * as path from 'node:path';

import { physicalGetRouteNodes } from '@tanstack/router-generator';

const DEFAULT_LOCALES = ['ko', 'en'] as const;

type CreateLocalizedPagesOptions = {
  localePages?: string | string[]
  locales?: readonly string[]
};

export async function createLocalizedPages({
  localePages = './src/routes/{-$locale}/**',
  locales = DEFAULT_LOCALES,
}: CreateLocalizedPagesOptions = {}) {
  const localePagePatterns = Array.isArray(localePages) ? localePages : [localePages];
  const matchedFiles = await collectMatchedFiles(localePagePatterns);
  const routePaths = await extractLocaleRoutePaths(matchedFiles);

  return routePaths
    .flatMap((routePath) =>
      locales.map((locale) => ({
        path: routePath.replace('{-$locale}', locale),
      })),
    );
}

async function extractLocaleRoutePaths(matchedFiles: Set<string>) {
  const { routeNodes } = await physicalGetRouteNodes(
    {
      routesDirectory: './src/routes',
      routeFileIgnorePrefix: '-',
      disableLogging: true,
      indexToken: 'index',
      routeToken: 'route',
    },
    process.cwd(),
    {
      indexTokenSegmentRegex: /^index$/,
      routeTokenSegmentRegex: /^route$/,
    },
  );

  return routeNodes
    .filter((routeNode) => matchedFiles.has(path.resolve('./src/routes', routeNode.filePath)))
    .map((routeNode) => routeNode.routePath ?? routeNode.fullPath)
    .sort((left, right) => left.localeCompare(right));
}

async function collectMatchedFiles(localePagePatterns: string[]) {
  const matches = await Promise.all(
    localePagePatterns.map(async (localePagePattern) => {
      const files: string[] = [];

      for await (const filePath of glob(localePagePattern, { cwd: process.cwd() })) {
        files.push(path.resolve(process.cwd(), filePath));
      }

      return files;
    }),
  );

  return new Set(matches.flat());
}

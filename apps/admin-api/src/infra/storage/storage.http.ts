import { mkdir } from 'node:fs/promises';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { TimeUtil } from '@pkg/shared/common';

export async function serveStorageFiles(app: NestExpressApplication, options: {
  directory: string
  publicUrlPrefix: string
  cacheMaxAgeSeconds: number
}): Promise<void> {
  await mkdir(options.directory, { recursive: true });
  let prefix = options.publicUrlPrefix;
  while (prefix.endsWith('/')) prefix = prefix.slice(0, -1);
  app.useStaticAssets(options.directory, {
    prefix: `${prefix}/`,
    dotfiles: 'deny',
    fallthrough: true,
    maxAge: TimeUtil.ms.second(options.cacheMaxAgeSeconds),
  });
}

import { join, resolve } from 'node:path';

import { API_PREFIX } from '#/common/configs/application.config';

export const OAUTH_ICON_UPLOAD_DIR = join(resolve(process.cwd(), 'data/uploads'), 'oauth-icons');
export const OAUTH_ICON_UPLOAD_URL_PREFIX = `/${API_PREFIX}/uploads/oauth-icons`;
export const OAUTH_ICON_MAX_SIZE = 2 * 1024 * 1024;

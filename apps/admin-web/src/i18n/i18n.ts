import { createWebI18n } from '@pkg/web-core/i18n';

import { i18nOptions } from '~/i18n/config';

export type { AppLocale } from '~/i18n/config';
export { defaultLocale } from '~/i18n/config';

export const { getI18n } = createWebI18n(i18nOptions);

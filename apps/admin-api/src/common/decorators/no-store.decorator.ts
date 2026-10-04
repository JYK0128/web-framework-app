import { applyDecorators, UseInterceptors } from '@nestjs/common';

import { NoStoreInterceptor } from '#/common/interceptors/no-store.interceptor';

export const NoStore = () => applyDecorators(UseInterceptors(NoStoreInterceptor));

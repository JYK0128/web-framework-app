import { applyDecorators, UseInterceptors } from '@nestjs/common';

import { NoStoreInterceptor } from '#http/interceptors/no-store.interceptor';

export const NoStore = () => applyDecorators(UseInterceptors(NoStoreInterceptor));

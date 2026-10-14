import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { NoStoreInterceptor } from '@pkg/server-core/http/interceptors/no-store.interceptor';

export const NoStore = () => applyDecorators(UseInterceptors(NoStoreInterceptor));

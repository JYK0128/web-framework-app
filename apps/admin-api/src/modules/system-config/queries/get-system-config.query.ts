import { Query } from '@nestjs/cqrs';

import type { SystemConfigResponseDto } from '#/modules/system-config/system-config.interfaces';

export class GetSystemConfigQuery extends Query<SystemConfigResponseDto> {}

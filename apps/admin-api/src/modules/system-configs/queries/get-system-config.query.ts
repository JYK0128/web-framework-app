import { Query } from '@nestjs/cqrs';

import type { SystemConfigResponseDto } from '#/modules/system-configs/dto/system-config.response.dto';

export class GetSystemConfigQuery extends Query<SystemConfigResponseDto> {}

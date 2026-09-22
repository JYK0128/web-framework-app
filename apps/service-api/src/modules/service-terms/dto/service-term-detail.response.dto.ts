import { ApiSchema } from '@nestjs/swagger';

import { ServiceTermItemDto } from './service-term-item.dto';

@ApiSchema({ name: 'ServiceTermDetailResponse' })
export class ServiceTermDetailResponseDto extends ServiceTermItemDto {}

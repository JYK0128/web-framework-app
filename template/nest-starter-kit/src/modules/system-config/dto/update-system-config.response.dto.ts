import { ApiSchema } from '@nestjs/swagger';

import { SystemConfigItemDto } from './system-config-item.dto';

@ApiSchema({ name: 'UpdateSystemConfigResponse' })
export class UpdateSystemConfigResponseDto extends SystemConfigItemDto {}

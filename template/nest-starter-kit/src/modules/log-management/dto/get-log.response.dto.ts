import { ApiSchema } from '@nestjs/swagger';

import { LogItemDto } from './log-item.dto';

@ApiSchema({ name: 'GetLogResponse' })
export class GetLogResponseDto extends LogItemDto {}

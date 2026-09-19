import { ApiSchema } from '@nestjs/swagger';

import { AdminTermItemDto } from './admin-term-item.dto';

@ApiSchema({ name: 'CreateTermResponse' })
export class CreateTermResponseDto extends AdminTermItemDto {}

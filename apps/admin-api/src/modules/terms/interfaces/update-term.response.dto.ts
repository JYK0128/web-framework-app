import { ApiSchema } from '@nestjs/swagger';

import { AdminTermItemDto } from './admin-term-item.dto';

@ApiSchema({ name: 'UpdateTermResponse' })
export class UpdateTermResponseDto extends AdminTermItemDto {}

import { ApiSchema } from '@nestjs/swagger';

import { OperatorTermItemDto } from './operator-term-item.dto';

@ApiSchema({ name: 'UpdateTermResponse' })
export class UpdateTermResponseDto extends OperatorTermItemDto {}

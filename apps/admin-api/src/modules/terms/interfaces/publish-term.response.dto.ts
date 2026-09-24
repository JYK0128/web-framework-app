import { ApiSchema } from '@nestjs/swagger';

import { OperatorTermItemDto } from './operator-term-item.dto';

@ApiSchema({ name: 'PublishTermResponse' })
export class PublishTermResponseDto extends OperatorTermItemDto {}

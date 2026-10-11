import { ApiSchema } from '@nestjs/swagger';

import { OperatorTermItemDto } from '#/modules/terms/dto/operator-term-item.dto';

@ApiSchema({ name: 'CreateTermResponse' })
export class CreateTermResponseDto extends OperatorTermItemDto {}

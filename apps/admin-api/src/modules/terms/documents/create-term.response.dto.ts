import { ApiSchema } from '@nestjs/swagger';

import { TermItemDto } from '#/modules/terms/documents/term-item.dto';

@ApiSchema({ name: 'CreateTermResponse' })
export class CreateTermResponseDto extends TermItemDto {}

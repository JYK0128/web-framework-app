import { ApiSchema } from '@nestjs/swagger';

import { TermItemDto } from '#/modules/term/document/term-item.dto';

@ApiSchema({ name: 'UpdateTermResponse' })
export class UpdateTermResponseDto extends TermItemDto {}

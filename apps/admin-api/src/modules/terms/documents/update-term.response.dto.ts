import { ApiSchema } from '@nestjs/swagger';

import { TermItemDto } from '#/modules/terms/documents/term-item.dto';

@ApiSchema({ name: 'UpdateTermResponse' })
export class UpdateTermResponseDto extends TermItemDto {}

import { ApiSchema } from '@nestjs/swagger';

import { TermItemDto } from '#/modules/terms/documents/term-item.dto';

@ApiSchema({ name: 'PublishTermResponse' })
export class PublishTermResponseDto extends TermItemDto {}

import { ApiSchema } from '@nestjs/swagger';

import { TermItemDto } from '~/modules/term/document/term-item.dto';

@ApiSchema({ name: 'PublishTermResponse' })
export class PublishTermResponseDto extends TermItemDto {}

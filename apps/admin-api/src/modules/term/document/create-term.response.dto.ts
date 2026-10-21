import { ApiSchema } from '@nestjs/swagger';

import { TermItemDto } from '~/modules/term/document/term-item.dto';

@ApiSchema({ name: 'CreateTermResponse' })
export class CreateTermResponseDto extends TermItemDto {}

import { ApiSchema } from '@nestjs/swagger';

import { AdminTermDto } from './admin-term.dto';

@ApiSchema({ name: 'PublishTermResponse' })
export class PublishTermResponseDto extends AdminTermDto {}

import { ApiSchema } from '@nestjs/swagger';

import { AdminTermDto } from './admin-term.dto';

@ApiSchema({ name: 'CreateTermResponse' })
export class CreateTermResponseDto extends AdminTermDto {}

import { ApiSchema } from '@nestjs/swagger';

import { AdminTermDto } from './admin-term.dto';

@ApiSchema({ name: 'UpdateTermResponse' })
export class UpdateTermResponseDto extends AdminTermDto {}

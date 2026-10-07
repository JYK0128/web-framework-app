import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'MarkAlertReadResponse' })
export class MarkAlertReadResponseDto extends OkResponseDto {}

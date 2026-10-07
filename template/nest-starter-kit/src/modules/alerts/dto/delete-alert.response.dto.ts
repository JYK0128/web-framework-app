import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'DeleteAlertResponse' })
export class DeleteAlertResponseDto extends OkResponseDto {}

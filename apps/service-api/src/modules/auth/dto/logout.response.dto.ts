import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'LogoutResponse' })
export class LogoutResponseDto extends OkResponseDto {}

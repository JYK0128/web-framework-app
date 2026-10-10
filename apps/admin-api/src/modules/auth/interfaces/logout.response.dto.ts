import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/dto/response';

@ApiSchema({ name: 'LogoutResponse' })
export class LogoutResponseDto extends OkResponseDto {}

import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/core/http/dto/response';

@ApiSchema({ name: 'LogoutResponse' })
export class LogoutResponseDto extends OkResponseDto {}

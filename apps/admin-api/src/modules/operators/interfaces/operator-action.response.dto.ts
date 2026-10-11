import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/core/http/dto/response/ok.response.dto';

@ApiSchema({ name: 'OperatorActionResponse' })
export class OperatorActionResponseDto extends OkResponseDto {}

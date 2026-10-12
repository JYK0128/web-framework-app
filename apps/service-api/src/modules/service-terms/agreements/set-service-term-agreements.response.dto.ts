import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/core/http/dto/response';

@ApiSchema({ name: 'SetServiceTermAgreementsResponse' })
export class SetServiceTermAgreementsResponseDto extends OkResponseDto {}

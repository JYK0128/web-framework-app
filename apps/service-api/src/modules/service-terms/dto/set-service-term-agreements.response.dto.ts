import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/dto/response';

@ApiSchema({ name: 'SetServiceTermAgreementsResponse' })
export class SetServiceTermAgreementsResponseDto extends OkResponseDto {}

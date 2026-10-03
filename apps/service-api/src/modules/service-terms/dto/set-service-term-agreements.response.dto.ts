import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'SetServiceTermAgreementsResponse' })
export class SetServiceTermAgreementsResponseDto extends OkResponseDto {}

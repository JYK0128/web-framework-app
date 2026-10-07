import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'BanUserResponse' })
export class BanUserResponseDto extends OkResponseDto {}

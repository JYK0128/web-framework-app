import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'DeleteUserResponse' })
export class DeleteUserResponseDto extends OkResponseDto {}

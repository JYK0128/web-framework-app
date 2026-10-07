import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'UpdateUserRoleResponse' })
export class UpdateUserRoleResponseDto extends OkResponseDto {}

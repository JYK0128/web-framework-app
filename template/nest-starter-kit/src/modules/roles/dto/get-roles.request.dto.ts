import { ListRequestDto } from '#/common/interfaces';
import { Role } from '#/entities/auth.extensions/role.entity';

export class GetRolesRequestDto extends ListRequestDto<Role> {}

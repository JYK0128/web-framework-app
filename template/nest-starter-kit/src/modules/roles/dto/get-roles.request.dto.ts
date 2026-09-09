import { ListRequestDto } from '#/common/interfaces';
import { Role } from '#/entities/auth.extentions/role.entity';

export class GetRolesRequestDto extends ListRequestDto<Role> {}

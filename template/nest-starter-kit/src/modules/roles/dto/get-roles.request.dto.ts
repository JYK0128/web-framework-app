import { DtoType } from '#/common/dto/entity-dto';
import { Role } from '#/entities/auth.extentions/role.entity';

export class GetRolesRequestDto extends DtoType(Role) {}

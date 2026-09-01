import { DtoType } from '#/common/dto/entity-dto';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class GetAdminTermGroupsRequestDto extends DtoType(TermGroup) {}

import { ListRequestDto } from '#/common/interfaces';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class GetAdminTermGroupsRequestDto extends ListRequestDto<TermGroup> {}

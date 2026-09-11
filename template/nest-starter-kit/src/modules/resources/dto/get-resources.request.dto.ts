import { ListRequestDto } from '#/common/interfaces';
import { Resource } from '#/entities/auth.extensions/resource.entity';

export class GetResourcesRequestDto extends ListRequestDto<Resource> {}

import { ListRequestDto } from '#/common/interfaces';
import { Resource } from '#/entities/auth.extentions/resource.entity';

export class GetResourcesRequestDto extends ListRequestDto<Resource> {}

import { ApiSchema } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request';

import { Term } from '~/core/database/entities/terms';

@ApiSchema({ name: 'GetServiceTermsRequest' })
export class GetServiceTermsRequestDto extends PageRequestDto<Term> {
  override get searchFields(): (keyof Term)[] { return ['version', 'content']; }
}

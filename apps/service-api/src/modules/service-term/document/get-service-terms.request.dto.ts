import { ApiSchema } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';

import { Term } from '~/core/database/entities/terms';

const GetServiceTermsRequestDtoBase = QueryRequestDtoFor<Term>()({
  search: { fields: ['version', 'content'] },
  sort: { fields: ['createdAt'], default: ['createdAt'] },
  page: {},
});

@ApiSchema({ name: 'GetServiceTermsRequest' })
export class GetServiceTermsRequestDto extends GetServiceTermsRequestDtoBase {

}

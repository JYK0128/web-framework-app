import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';

const PageQuery = QueryRequestDtoFor<object>()({ page: {} });

export class GetServiceTermRevisionsRequestDto extends PageQuery {}

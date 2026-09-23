import { Query } from '@nestjs/cqrs';
import { AdminServiceTermGroupListResponseDto } from '../dto';

export class GetAdminServiceTermGroupsQuery extends Query<AdminServiceTermGroupListResponseDto> {}

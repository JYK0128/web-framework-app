import { Query } from '@nestjs/cqrs';

import { ServiceUsersQueryDto, ServiceUsersResponseDto } from '#/modules/admin/service-user.dto';

export class GetServiceUsersQuery extends Query<ServiceUsersResponseDto> {
  constructor(public readonly input: ServiceUsersQueryDto) {
    super();
  }
}

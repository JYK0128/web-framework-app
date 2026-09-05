import { Query } from '@nestjs/cqrs';

import { type GetLogsRequestDto, type GetLogsResponseDto } from '#/modules/log-management/dto';

export class GetLogsQuery extends Query<GetLogsResponseDto> {
  constructor(public readonly query: GetLogsRequestDto) {
    super();
  }
}

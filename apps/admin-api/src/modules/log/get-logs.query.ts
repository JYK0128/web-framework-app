import { Query } from '@nestjs/cqrs';

import type { GetLogsRequestDto } from '#/modules/log/get-logs.request.dto';
import type { GetLogsResponseDto } from '#/modules/log/get-logs.response.dto';

export class GetLogsQuery extends Query<GetLogsResponseDto> {
  constructor(public readonly input: GetLogsRequestDto) { super(); }
}

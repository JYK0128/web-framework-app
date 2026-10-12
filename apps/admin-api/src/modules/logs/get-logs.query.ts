import { Query } from '@nestjs/cqrs';

import type { GetLogsRequestDto } from '#/modules/logs/get-logs.request.dto';
import type { LogPageResponseDto } from '#/modules/logs/log-page.response.dto';

export class GetLogsQuery extends Query<LogPageResponseDto> {
  constructor(public readonly input: GetLogsRequestDto) { super(); }
}

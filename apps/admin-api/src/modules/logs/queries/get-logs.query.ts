import { Query } from '@nestjs/cqrs';

import type { GetLogsRequestDto } from '#/modules/logs/dto/get-logs.request.dto';
import type { LogPageResponseDto } from '#/modules/logs/dto/log-page.response.dto';

export class GetLogsQuery extends Query<LogPageResponseDto> {
  constructor(public readonly input: GetLogsRequestDto) { super(); }
}

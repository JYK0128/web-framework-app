import { Query } from '@nestjs/cqrs';

import type { GetLogsRequestDto } from '../dto/get-logs.request.dto';
import type { LogPageResponseDto } from '../dto/log-page.response.dto';

export class GetLogsQuery extends Query<LogPageResponseDto> {
  constructor(public readonly input: GetLogsRequestDto) { super(); }
}

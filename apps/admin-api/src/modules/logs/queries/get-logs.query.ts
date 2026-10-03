import { Query } from '@nestjs/cqrs';

import type { GetLogsRequestDto } from '../dto/get-logs.request.dto';
import type { LogListResponseDto } from '../dto/log-list.response.dto';

export class GetLogsQuery extends Query<LogListResponseDto> {
  constructor(public readonly input: GetLogsRequestDto) { super(); }
}

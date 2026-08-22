import { Query } from '@nestjs/cqrs';

import type { ActivityStatsResponseDto } from '#/modules/activity-logs/dto';

export class GetActivityStatsQuery extends Query<ActivityStatsResponseDto> {}

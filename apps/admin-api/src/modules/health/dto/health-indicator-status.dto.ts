import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

@ApiSchema({ name: 'HealthIndicatorStatus' })
export class HealthIndicatorStatusDto extends BaseDto {
  @ApiProperty({ type: String, example: 'up', description: '인디케이터 상태' })
  status!: string;
}

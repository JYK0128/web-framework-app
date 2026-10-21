import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthIndicatorService, MikroOrmHealthIndicator } from '@nestjs/terminus';
import { Public, SwaggerApiResponse } from '@pkg/server-core/http/decorators';
import { KvStore } from '@pkg/server-core/kv-store';

import { CheckLiveRequestDto } from '~/modules/health/check-live.request.dto';
import { CheckLiveResponseDto } from '~/modules/health/check-live.response.dto';
import { CheckReadyRequestDto } from '~/modules/health/check-ready.request.dto';
import { CheckReadyResponseDto } from '~/modules/health/check-ready.response.dto';

/**
 * Health check controller
 * Note: Intentionally a direct integration with Terminus per cqrs.md architectural rules.
 * Direct infrastructure checks do not need an artificial Command/Query pair.
 */
@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: MikroOrmHealthIndicator,
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly kvStore: KvStore,
  ) {}

  @Public()
  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: '서버 실행 상태 확인' })
  @SwaggerApiResponse(CheckLiveResponseDto)
  async checkLive(_input: CheckLiveRequestDto = new CheckLiveRequestDto()): Promise<CheckLiveResponseDto> {
    return CheckLiveResponseDto.parse((await this.health.check([])));
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: '서버 연결 상태 확인' })
  @SwaggerApiResponse(CheckReadyResponseDto)
  async checkReady(_input: CheckReadyRequestDto = new CheckReadyRequestDto()): Promise<CheckReadyResponseDto> {
    return CheckReadyResponseDto.parse((await this.health.check([
      () => this.db.pingCheck('database'),
      () =>
        this.healthIndicatorService
          .check('redis')
          .attempt(async () => {
            const isUp = await this.kvStore.ping();
            if (!isUp) throw new Error('Redis connection is down');
          }),
    ])));
  }
}

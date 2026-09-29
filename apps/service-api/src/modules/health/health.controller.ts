import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthIndicatorService, MikroOrmHealthIndicator } from '@nestjs/terminus';

import { Public } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { KvStore } from '#/infra/kv-store/kv-store.service';

import { HealthResponseDto } from './dto/health.response.dto';

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
  @ApiOperation({ summary: 'Liveness Probe (프로세스 생존 여부 확인)' })
  @SwaggerApiResponse(HealthResponseDto)
  async checkLive(): Promise<HealthResponseDto> {
    return (await this.health.check([])) as HealthResponseDto;
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness Probe (DB 및 Redis 연결 상태 종합 점검)' })
  @SwaggerApiResponse(HealthResponseDto)
  async checkReady(): Promise<HealthResponseDto> {
    return (await this.health.check([
      () => this.db.pingCheck('database'),
      () =>
        this.healthIndicatorService
          .check('redis')
          .attempt(async () => {
            const isUp = await this.kvStore.ping();
            if (!isUp) throw new Error('Redis connection is down');
          }),
    ])) as HealthResponseDto;
  }

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: '기본 헬스체크 (하위 호환성 유지 - readiness 확인)' })
  @SwaggerApiResponse(HealthResponseDto)
  check(): Promise<HealthResponseDto> {
    return this.checkReady();
  }
}

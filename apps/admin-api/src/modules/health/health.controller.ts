import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthIndicatorService, MikroOrmHealthIndicator } from '@nestjs/terminus';
import { Public, SwaggerApiResponse } from '@pkg/server-core/http/decorators';
import { KvStore } from '@pkg/server-core/kv-store';
import { LoggerService } from '@pkg/server-core/logger';

import { CheckLiveRequestDto } from '~/modules/health/check-live.request.dto';
import { CheckLiveResponseDto } from '~/modules/health/check-live.response.dto';
import { CheckReadyRequestDto } from '~/modules/health/check-ready.request.dto';
import { CheckReadyResponseDto } from '~/modules/health/check-ready.response.dto';

const READY_CHECK_TIMEOUT_MS = 4_000;
const SLOW_DEPENDENCY_CHECK_MS = 1_000;

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
    @Inject(LoggerService) private readonly logger: LoggerService,
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
      () => this.withDependencyTiming('database', async () => await this.db.pingCheck('database').withTimeout(READY_CHECK_TIMEOUT_MS)),
      () => this.withDependencyTiming(
        'redis',
        async () =>
          await this.healthIndicatorService
            .check('redis')
            .attempt(async () => {
              const isUp = await this.kvStore.ping();
              if (!isUp) throw new Error('Redis connection is down');
            })
            .withTimeout(READY_CHECK_TIMEOUT_MS),
      ),
    ])));
  }

  private async withDependencyTiming<T>(dependency: string, check: () => Promise<T>): Promise<T> {
    const startedAt = Date.now();
    let errorName: string | undefined;

    try {
      return await check();
    }
    catch (error) {
      errorName = error instanceof Error ? error.name : 'UnknownError';
      throw error;
    }
    finally {
      const durationMs = Date.now() - startedAt;
      if (durationMs >= SLOW_DEPENDENCY_CHECK_MS || errorName) {
        const memory = process.memoryUsage();
        this.logger.warn('Slow or failed readiness dependency check', {
          event: 'health.dependency_check',
          timestamp: new Date().toISOString(),
          service: 'admin-api',
          dependency,
          durationMs,
          outcome: errorName ? 'error' : 'slow',
          errorName,
          processRssMb: Math.round(memory.rss / 1024 / 1024),
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        }, 'HEALTH');
      }
    }
  }
}

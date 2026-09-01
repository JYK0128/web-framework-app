import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { HealthResponseDto } from './dto/health.response.dto';

@Controller('health')
@ApiTags('health')
export class HealthController {
  @Public()
  @Get()
  @SwaggerApiResponse(HealthResponseDto)
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      service: 'nest-starter-kit',
      timestamp: new Date().toISOString(),
    };
  }
}

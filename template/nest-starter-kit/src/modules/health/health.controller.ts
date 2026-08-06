import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiOkResponseData } from '#/common/decorators/api-ok-response-data.decorator';
import { Public } from '#/common/decorators/public.decorator';

import { HealthResponseDto } from './dto/health.response.dto';

@Controller('health')
@ApiTags('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOkResponseData(HealthResponseDto)
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      service: 'nest-starter-kit',
      timestamp: new Date().toISOString(),
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '#/common/decorators/public.decorator';

@Controller('health')
@ApiTags('health')
export class HealthController {
  @Get()
  @Public()
  getHealth() {
    return {
      status: 'ok',
      service: 'nest-starter-kit',
      timestamp: new Date().toISOString(),
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { GetResourcesResponseDto } from '#/modules/resources/dto';
import { GetResourcesQuery } from '#/modules/resources/queries';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Permission('role:manage', 'role:read')
  @Get()
  @SwaggerApiResponse(GetResourcesResponseDto)
  async getResources(): Promise<GetResourcesResponseDto> {
    return this.queryBus.execute(new GetResourcesQuery());
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { CreateResourceCommand, DeleteResourceCommand, UpdateResourceCommand } from '#/modules/resources/commands';
import { CreateResourceRequestDto, CreateResourceResponseDto, DeleteResourceResponseDto, GetResourcesResponseDto, UpdateResourceRequestDto, UpdateResourceResponseDto } from '#/modules/resources/dto';
import { GetResourcesQuery } from '#/modules/resources/queries';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Permission('role:manage', 'role:create')
  @Post()
  @SwaggerApiResponse(CreateResourceResponseDto)
  async createResource(@Body() dto: CreateResourceRequestDto): Promise<CreateResourceResponseDto> {
    return this.commandBus.execute(new CreateResourceCommand(dto));
  }

  @Permission('role:manage', 'role:read')
  @Get()
  @SwaggerApiResponse(GetResourcesResponseDto)
  async getResources(): Promise<GetResourcesResponseDto> {
    return this.queryBus.execute(new GetResourcesQuery());
  }

  @Permission('role:manage', 'role:update')
  @Patch(':id')
  @SwaggerApiResponse(UpdateResourceResponseDto)
  async updateResource(@Param('id') id: string, @Body() dto: UpdateResourceRequestDto): Promise<UpdateResourceResponseDto> {
    return this.commandBus.execute(new UpdateResourceCommand({ id, input: dto }));
  }

  @Permission('role:manage', 'role:delete')
  @Delete(':id')
  @SwaggerApiResponse(DeleteResourceResponseDto)
  async deleteResource(@Param('id') id: string): Promise<DeleteResourceResponseDto> {
    return this.commandBus.execute(new DeleteResourceCommand({ id }));
  }
}

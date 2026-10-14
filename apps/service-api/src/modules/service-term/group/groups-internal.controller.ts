import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MachineAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { CreateInternalServiceTermGroupCommand } from '#/modules/service-term/group/create-internal-service-term-group.command';
import { CreateInternalServiceTermGroupRequestDto } from '#/modules/service-term/group/create-internal-service-term-group.request.dto';
import { CreateInternalServiceTermGroupResponseDto } from '#/modules/service-term/group/create-internal-service-term-group.response.dto';
import { DeleteInternalServiceTermGroupCommand } from '#/modules/service-term/group/delete-internal-service-term-group.command';
import { DeleteInternalServiceTermGroupRequestDto } from '#/modules/service-term/group/delete-internal-service-term-group.request.dto';
import { DeleteInternalServiceTermGroupResponseDto } from '#/modules/service-term/group/delete-internal-service-term-group.response.dto';
import { GetInternalServiceTermGroupsQuery } from '#/modules/service-term/group/get-internal-service-term-groups.query';
import { GetInternalServiceTermGroupsRequestDto } from '#/modules/service-term/group/get-internal-service-term-groups.request.dto';
import { GetInternalServiceTermGroupsResponseDto } from '#/modules/service-term/group/get-internal-service-term-groups.response.dto';
import { UpdateInternalServiceTermGroupCommand } from '#/modules/service-term/group/update-internal-service-term-group.command';
import { UpdateInternalServiceTermGroupRequestDto } from '#/modules/service-term/group/update-internal-service-term-group.request.dto';
import { UpdateInternalServiceTermGroupResponseDto } from '#/modules/service-term/group/update-internal-service-term-group.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/service-terms')
export class InternalServiceTermGroupsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get('groups') @ApiOperation({ operationId: 'InternalServiceTermsController_groups_v1', summary: 'Machine: 서비스 약관 그룹 목록 조회' }) @SwaggerApiResponse(GetInternalServiceTermGroupsResponseDto)
  groups(): Promise<GetInternalServiceTermGroupsResponseDto> {
    return this.queryBus.execute(new GetInternalServiceTermGroupsQuery(new GetInternalServiceTermGroupsRequestDto()));
  }

  @ApiOperation({ summary: undefined, operationId: 'InternalServiceTermsController_createGroup_v1' })
  @Post('groups') @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(CreateInternalServiceTermGroupResponseDto, HttpStatus.CREATED)
  createGroup(@Body() input: CreateInternalServiceTermGroupRequestDto): Promise<CreateInternalServiceTermGroupResponseDto> { return this.commandBus.execute(new CreateInternalServiceTermGroupCommand(input)); }

  @ApiOperation({ summary: undefined, operationId: 'InternalServiceTermsController_updateGroup_v1' })
  @Patch('groups/:id') @SwaggerApiResponse(UpdateInternalServiceTermGroupResponseDto)
  updateGroup(@Param('id') id: string, @Body() input: UpdateInternalServiceTermGroupRequestDto): Promise<UpdateInternalServiceTermGroupResponseDto> { return this.commandBus.execute(new UpdateInternalServiceTermGroupCommand({ groupId: id, dto: input })); }

  @ApiOperation({ summary: undefined, operationId: 'InternalServiceTermsController_deleteGroup_v1' })
  @Delete('groups/:id') @SwaggerApiResponse(DeleteInternalServiceTermGroupResponseDto)
  deleteGroup(@Param('id') id: string): Promise<DeleteInternalServiceTermGroupResponseDto> {
    const request = DeleteInternalServiceTermGroupRequestDto.parse({ groupId: id }).validate();
    return this.commandBus.execute(new DeleteInternalServiceTermGroupCommand(request));
  }
}

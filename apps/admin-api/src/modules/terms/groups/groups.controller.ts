import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { CreateTermGroupCommand } from './create-term-group.command';
import { CreateTermGroupRequestDto } from './create-term-group.request.dto';
import { CreateTermGroupResponseDto } from './create-term-group.response.dto';
import { DeleteTermGroupCommand } from './delete-term-group.command';
import { DeleteTermGroupRequestDto } from './delete-term-group.request.dto';
import { DeleteTermGroupResponseDto } from './delete-term-group.response.dto';
import { GetTermGroupsQuery } from './get-term-groups.query';
import { GetTermGroupsRequestDto } from './get-term-groups.request.dto';
import { GetTermGroupsResponseDto } from './get-term-groups.response.dto';
import { UpdateTermGroupCommand } from './update-term-group.command';
import { UpdateTermGroupRequestDto } from './update-term-group.request.dto';
import { UpdateTermGroupResponseDto } from './update-term-group.response.dto';

@ApiTags('terms')
@UserAuth()
@Controller('terms')
export class TermGroupsController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @Get('groups')
  @Permissions(AdminPermission.terms.read)
  @ApiOperation({ summary: '약관 그룹 목록 조회', operationId: 'TermsController_getTermGroups_v1' })
  @SwaggerApiResponse(GetTermGroupsResponseDto)
  async getTermGroups(@Query() input: GetTermGroupsRequestDto): Promise<GetTermGroupsResponseDto> {
    return this.queryBus.execute(new GetTermGroupsQuery(input));
  }

  @Post('groups')
  @Permissions(AdminPermission.terms.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '약관 그룹 생성', operationId: 'TermsController_createTermGroup_v1' })
  @SwaggerApiResponse(CreateTermGroupResponseDto, HttpStatus.CREATED)
  async createTermGroup(@Body() input: CreateTermGroupRequestDto): Promise<CreateTermGroupResponseDto> {
    return this.commandBus.execute(new CreateTermGroupCommand(input));
  }

  @Patch('groups/:id')
  @Permissions(AdminPermission.terms.update)
  @ApiOperation({ summary: '약관 그룹 수정', operationId: 'TermsController_updateTermGroup_v1' })
  @SwaggerApiResponse(UpdateTermGroupResponseDto)
  async updateTermGroup(@Param('id') id: string, @Body() input: UpdateTermGroupRequestDto): Promise<UpdateTermGroupResponseDto> {
    return this.commandBus.execute(new UpdateTermGroupCommand({ groupId: id, data: input }));
  }

  @Delete('groups/:id')
  @Permissions(AdminPermission.terms.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 그룹 삭제', operationId: 'TermsController_deleteTermGroup_v1' })
  @SwaggerApiResponse(DeleteTermGroupResponseDto)
  async deleteTermGroup(@Param('id') id: string): Promise<DeleteTermGroupResponseDto> {
    return this.commandBus.execute(new DeleteTermGroupCommand(DeleteTermGroupRequestDto.parse({ groupId: id }).validate()));
  }
}

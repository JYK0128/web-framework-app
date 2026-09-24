import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { CreateInternalServiceTermCommand, CreateInternalServiceTermGroupCommand, DeleteInternalServiceTermCommand, DeleteInternalServiceTermGroupCommand, PublishInternalServiceTermCommand, UpdateInternalServiceTermCommand, UpdateInternalServiceTermGroupCommand } from '#/modules/service-terms/commands';
import { GetInternalServiceTermsRequestDto, InternalServiceTermGroupItemDto, InternalServiceTermGroupListResponseDto, InternalServiceTermGroupRequestDto, InternalServiceTermItemDto, InternalServiceTermListResponseDto, InternalServiceTermRequestDto } from '#/modules/service-terms/dto';
import { GetInternalServiceTermGroupsQuery, GetInternalServiceTermsQuery } from '#/modules/service-terms/queries';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/service-terms')
export class InternalServiceTermsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}
  @Get('groups') @ApiOperation({ summary: 'Machine: 서비스 약관 그룹 목록 조회' }) @SwaggerApiResponse(InternalServiceTermGroupListResponseDto)
  groups(): Promise<InternalServiceTermGroupListResponseDto> { return this.queryBus.execute(new GetInternalServiceTermGroupsQuery()); }

  @Post('groups') @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(InternalServiceTermGroupItemDto, HttpStatus.CREATED)
  createGroup(@Body() input: InternalServiceTermGroupRequestDto): Promise<InternalServiceTermGroupItemDto> { return this.commandBus.execute(new CreateInternalServiceTermGroupCommand(input)); }

  @Patch('groups/:id') @SwaggerApiResponse(InternalServiceTermGroupItemDto)
  updateGroup(@Param('id') id: string, @Body() input: InternalServiceTermGroupRequestDto): Promise<InternalServiceTermGroupItemDto> { return this.commandBus.execute(new UpdateInternalServiceTermGroupCommand({ groupId: id, dto: input })); }

  @Delete('groups/:id') @SwaggerApiResponse(Object)
  deleteGroup(@Param('id') id: string): Promise<{ success: boolean }> { return this.commandBus.execute(new DeleteInternalServiceTermGroupCommand(id)); }

  @Get() @ApiOperation({ summary: 'Machine: 서비스 약관 목록 조회' }) @SwaggerApiResponse(InternalServiceTermListResponseDto)
  list(@Query() query: GetInternalServiceTermsRequestDto): Promise<InternalServiceTermListResponseDto> { return this.queryBus.execute(new GetInternalServiceTermsQuery(query)); }

  @Post() @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(InternalServiceTermItemDto, HttpStatus.CREATED)
  create(@Body() input: InternalServiceTermRequestDto): Promise<InternalServiceTermItemDto> { return this.commandBus.execute(new CreateInternalServiceTermCommand(input)); }

  @Patch(':id') @SwaggerApiResponse(InternalServiceTermItemDto)
  update(@Param('id') id: string, @Body() input: InternalServiceTermRequestDto): Promise<InternalServiceTermItemDto> { return this.commandBus.execute(new UpdateInternalServiceTermCommand({ termId: id, dto: input })); }

  @Post(':id/publish') @SwaggerApiResponse(InternalServiceTermItemDto)
  publish(@Param('id') id: string): Promise<InternalServiceTermItemDto> { return this.commandBus.execute(new PublishInternalServiceTermCommand(id)); }

  @Delete(':id') @SwaggerApiResponse(Object)
  delete(@Param('id') id: string): Promise<{ success: boolean }> { return this.commandBus.execute(new DeleteInternalServiceTermCommand(id)); }
}

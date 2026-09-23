import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { AdminServiceTermGroupItemDto, AdminServiceTermGroupListResponseDto, AdminServiceTermGroupRequestDto, AdminServiceTermItemDto, AdminServiceTermListResponseDto, AdminServiceTermRequestDto, GetAdminServiceTermsRequestDto } from '#/modules/service-terms/dto';
import { CreateAdminServiceTermGroupCommand, CreateAdminServiceTermCommand, DeleteAdminServiceTermGroupCommand, DeleteAdminServiceTermCommand, PublishAdminServiceTermCommand, UpdateAdminServiceTermGroupCommand, UpdateAdminServiceTermCommand } from '#/modules/service-terms/commands';
import { GetAdminServiceTermGroupsQuery, GetAdminServiceTermsQuery } from '#/modules/service-terms/queries';

@ApiTags('Internal (Machine)')
@MachineAuth()
@Controller('internal/service-terms')
export class InternalServiceTermsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}
  @Get('groups') @ApiOperation({ summary: 'Machine: 서비스 약관 그룹 목록 조회' }) @SwaggerApiResponse(AdminServiceTermGroupListResponseDto)
  groups(): Promise<AdminServiceTermGroupListResponseDto> { return this.queryBus.execute(new GetAdminServiceTermGroupsQuery()); }
  @Post('groups') @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(AdminServiceTermGroupItemDto, HttpStatus.CREATED)
  createGroup(@Body() input: AdminServiceTermGroupRequestDto): Promise<AdminServiceTermGroupItemDto> { return this.commandBus.execute(new CreateAdminServiceTermGroupCommand(input)); }
  @Patch('groups/:id') @SwaggerApiResponse(AdminServiceTermGroupItemDto)
  updateGroup(@Param('id') id: string, @Body() input: AdminServiceTermGroupRequestDto): Promise<AdminServiceTermGroupItemDto> { return this.commandBus.execute(new UpdateAdminServiceTermGroupCommand({ groupId: id, dto: input })); }
  @Delete('groups/:id') @SwaggerApiResponse(Object)
  deleteGroup(@Param('id') id: string): Promise<{ success: boolean }> { return this.commandBus.execute(new DeleteAdminServiceTermGroupCommand(id)); }
  @Get() @ApiOperation({ summary: 'Machine: 서비스 약관 목록 조회' }) @SwaggerApiResponse(AdminServiceTermListResponseDto)
  list(@Query() query: GetAdminServiceTermsRequestDto): Promise<AdminServiceTermListResponseDto> { return this.queryBus.execute(new GetAdminServiceTermsQuery(query)); }
  @Post() @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(AdminServiceTermItemDto, HttpStatus.CREATED)
  create(@Body() input: AdminServiceTermRequestDto): Promise<AdminServiceTermItemDto> { return this.commandBus.execute(new CreateAdminServiceTermCommand(input)); }
  @Patch(':id') @SwaggerApiResponse(AdminServiceTermItemDto)
  update(@Param('id') id: string, @Body() input: AdminServiceTermRequestDto): Promise<AdminServiceTermItemDto> { return this.commandBus.execute(new UpdateAdminServiceTermCommand({ termId: id, dto: input })); }
  @Post(':id/publish') @SwaggerApiResponse(AdminServiceTermItemDto)
  publish(@Param('id') id: string): Promise<AdminServiceTermItemDto> { return this.commandBus.execute(new PublishAdminServiceTermCommand(id)); }
  @Delete(':id') @SwaggerApiResponse(Object)
  delete(@Param('id') id: string): Promise<{ success: boolean }> { return this.commandBus.execute(new DeleteAdminServiceTermCommand(id)); }
}

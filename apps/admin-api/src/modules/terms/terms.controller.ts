import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { CreateTermCommand, CreateTermGroupCommand, DeleteTermCommand, DeleteTermGroupCommand, PublishTermCommand, SetAgreementsCommand, UpdateTermCommand, UpdateTermGroupCommand } from '#/modules/terms/commands';
import { CreateTermGroupRequestDto, CreateTermGroupResponseDto, CreateTermRequestDto, CreateTermResponseDto, DeleteTermGroupResponseDto, DeleteTermResponseDto, GetAgreementHistoryRequestDto, GetAgreementHistoryResponseDto, GetAgreementsRequestDto, GetAgreementsResponseDto, GetOperatorTermGroupsResponseDto, GetOperatorTermsRequestDto, GetOperatorTermsResponseDto, PublishTermResponseDto, SetAgreementsRequestDto, SetAgreementsResponseDto, UpdateTermGroupRequestDto, UpdateTermGroupResponseDto, UpdateTermRequestDto, UpdateTermResponseDto } from '#/modules/terms/interfaces';
import { GetAgreementHistoryQuery, GetAgreementsQuery, GetOperatorTermGroupsQuery, GetOperatorTermsQuery } from '#/modules/terms/queries';

@ApiTags('operator-terms')
@UserAuth()
@Controller('operator-terms')
export class OperatorTermsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('agreements')
  @ApiOperation({ summary: '약관 동의 목록 조회' })
  @SwaggerApiResponse(GetAgreementsResponseDto)
  async getAgreements(@Query() query: GetAgreementsRequestDto): Promise<GetAgreementsResponseDto> {
    return this.queryBus.execute(new GetAgreementsQuery(query));
  }

  @Get('agreements/history')
  @ApiOperation({ summary: '약관 동의 이력 조회' })
  @SwaggerApiResponse(GetAgreementHistoryResponseDto)
  async getAgreementHistory(@Query() query: GetAgreementHistoryRequestDto): Promise<GetAgreementHistoryResponseDto> {
    return this.queryBus.execute(new GetAgreementHistoryQuery(query));
  }

  @Get()
  @Permissions(Permission.terms.read)
  @ApiOperation({ summary: '약관 목록 조회' })
  @SwaggerApiResponse(GetOperatorTermsResponseDto)
  async getOperatorTerms(@Query() query: GetOperatorTermsRequestDto): Promise<GetOperatorTermsResponseDto> {
    return this.queryBus.execute(new GetOperatorTermsQuery(query));
  }

  @Get('groups')
  @Permissions(Permission.terms.read)
  @ApiOperation({ summary: '약관 그룹 목록 조회' })
  @SwaggerApiResponse(GetOperatorTermGroupsResponseDto)
  async getOperatorTermGroups(): Promise<GetOperatorTermGroupsResponseDto> {
    return this.queryBus.execute(new GetOperatorTermGroupsQuery());
  }

  @Post('groups')
  @Permissions(Permission.terms.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '약관 그룹 생성' })
  @SwaggerApiResponse(CreateTermGroupResponseDto, HttpStatus.CREATED)
  async createOperatorTermGroup(@Body() input: CreateTermGroupRequestDto): Promise<CreateTermGroupResponseDto> {
    return this.commandBus.execute(new CreateTermGroupCommand(input));
  }

  @Patch('groups/:id')
  @Permissions(Permission.terms.update)
  @ApiOperation({ summary: '약관 그룹 수정' })
  @SwaggerApiResponse(UpdateTermGroupResponseDto)
  async updateOperatorTermGroup(@Param('id') id: string, @Body() input: UpdateTermGroupRequestDto): Promise<UpdateTermGroupResponseDto> {
    return this.commandBus.execute(new UpdateTermGroupCommand({ groupId: id, data: input }));
  }

  @Delete('groups/:id')
  @Permissions(Permission.terms.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 그룹 삭제' })
  @SwaggerApiResponse(DeleteTermGroupResponseDto)
  async deleteOperatorTermGroup(@Param('id') id: string): Promise<DeleteTermGroupResponseDto> {
    return this.commandBus.execute(new DeleteTermGroupCommand({ groupId: id }));
  }

  @Post()
  @Permissions(Permission.terms.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '약관 생성' })
  @SwaggerApiResponse(CreateTermResponseDto, HttpStatus.CREATED)
  async createOperatorTerm(@Body() input: CreateTermRequestDto): Promise<CreateTermResponseDto> {
    return this.commandBus.execute(new CreateTermCommand(input));
  }

  @Patch(':id')
  @Permissions(Permission.terms.update)
  @ApiOperation({ summary: '약관 수정' })
  @SwaggerApiResponse(UpdateTermResponseDto)
  async updateOperatorTerm(@Param('id') id: string, @Body() input: UpdateTermRequestDto): Promise<UpdateTermResponseDto> {
    return this.commandBus.execute(new UpdateTermCommand({ termId: id, data: input }));
  }

  @Post(':id/publish')
  @Permissions(Permission.terms.publish)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 게시' })
  @SwaggerApiResponse(PublishTermResponseDto)
  async publishOperatorTerm(@Param('id') id: string): Promise<PublishTermResponseDto> {
    return this.commandBus.execute(new PublishTermCommand({ termId: id }));
  }

  @Delete(':id')
  @Permissions(Permission.terms.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 삭제' })
  @SwaggerApiResponse(DeleteTermResponseDto)
  async deleteOperatorTerm(@Param('id') id: string): Promise<DeleteTermResponseDto> {
    return this.commandBus.execute(new DeleteTermCommand({ termId: id }));
  }

  @Post('agreements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 동의 저장' })
  @SwaggerApiResponse(SetAgreementsResponseDto)
  async setOperatorAgreements(@Body() input: SetAgreementsRequestDto): Promise<SetAgreementsResponseDto> {
    return this.commandBus.execute(new SetAgreementsCommand(input));
  }
}

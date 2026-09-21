import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { CreateTermCommand, CreateTermGroupCommand, DeleteTermCommand, DeleteTermGroupCommand, PublishTermCommand, SetAgreementsCommand, UpdateTermCommand, UpdateTermGroupCommand } from '#/modules/terms/commands';
import { CreateTermGroupRequestDto, CreateTermGroupResponseDto, CreateTermRequestDto, CreateTermResponseDto, DeleteTermGroupResponseDto, DeleteTermResponseDto, GetAgreementHistoryRequestDto, GetAgreementHistoryResponseDto, GetAgreementsRequestDto, GetAgreementsResponseDto, GetUserTermGroupsResponseDto, GetUserTermsRequestDto, GetUserTermsResponseDto, PublishTermResponseDto, SetAgreementsRequestDto, SetAgreementsResponseDto, UpdateTermGroupRequestDto, UpdateTermGroupResponseDto, UpdateTermRequestDto, UpdateTermResponseDto } from '#/modules/terms/interfaces';
import { GetAgreementHistoryQuery, GetAgreementsQuery, GetUserTermGroupsQuery, GetUserTermsQuery } from '#/modules/terms/queries';

@ApiTags('Terms')
@ApiBearerAuth()
@UserAuth()
@Controller('terms')
export class TermsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('agreements')
  @SwaggerApiResponse(GetAgreementsResponseDto)
  async getAgreements(@Query() query: GetAgreementsRequestDto): Promise<GetAgreementsResponseDto> {
    return this.queryBus.execute(new GetAgreementsQuery(query));
  }

  @Get('agreements/history')
  @SwaggerApiResponse(GetAgreementHistoryResponseDto)
  async getAgreementHistory(@Query() query: GetAgreementHistoryRequestDto): Promise<GetAgreementHistoryResponseDto> {
    return this.queryBus.execute(new GetAgreementHistoryQuery(query));
  }

  @Get('user')
  @SwaggerApiResponse(GetUserTermsResponseDto)
  async getUserTerms(@Query() query: GetUserTermsRequestDto): Promise<GetUserTermsResponseDto> {
    return this.queryBus.execute(new GetUserTermsQuery(query));
  }

  @Get('user/groups')
  @SwaggerApiResponse(GetUserTermGroupsResponseDto)
  async getUserTermGroups(): Promise<GetUserTermGroupsResponseDto> {
    return this.queryBus.execute(new GetUserTermGroupsQuery());
  }

  @Post('user/groups')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateTermGroupResponseDto, HttpStatus.CREATED)
  async createTermGroup(@Body() input: CreateTermGroupRequestDto): Promise<CreateTermGroupResponseDto> {
    return this.commandBus.execute(new CreateTermGroupCommand(input));
  }

  @Patch('user/groups/:id')
  @SwaggerApiResponse(UpdateTermGroupResponseDto)
  async updateTermGroup(@Param('id') id: string, @Body() input: UpdateTermGroupRequestDto): Promise<UpdateTermGroupResponseDto> {
    return this.commandBus.execute(new UpdateTermGroupCommand({ groupId: id, data: input }));
  }

  @Delete('user/groups/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteTermGroupResponseDto)
  async deleteTermGroup(@Param('id') id: string): Promise<DeleteTermGroupResponseDto> {
    return this.commandBus.execute(new DeleteTermGroupCommand({ groupId: id }));
  }

  @Post('user')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateTermResponseDto, HttpStatus.CREATED)
  async createTerm(@Body() input: CreateTermRequestDto): Promise<CreateTermResponseDto> {
    return this.commandBus.execute(new CreateTermCommand(input));
  }

  @Patch('user/:id')
  @SwaggerApiResponse(UpdateTermResponseDto)
  async updateTerm(@Param('id') id: string, @Body() input: UpdateTermRequestDto): Promise<UpdateTermResponseDto> {
    return this.commandBus.execute(new UpdateTermCommand({ termId: id, data: input }));
  }

  @Post('user/:id/publish')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(PublishTermResponseDto)
  async publishTerm(@Param('id') id: string): Promise<PublishTermResponseDto> {
    return this.commandBus.execute(new PublishTermCommand({ termId: id }));
  }

  @Delete('user/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteTermResponseDto)
  async deleteTerm(@Param('id') id: string): Promise<DeleteTermResponseDto> {
    return this.commandBus.execute(new DeleteTermCommand({ termId: id }));
  }

  @Post('agree')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(SetAgreementsResponseDto)
  async setAgreements(@Body() input: SetAgreementsRequestDto): Promise<SetAgreementsResponseDto> {
    return this.commandBus.execute(new SetAgreementsCommand(input));
  }
}

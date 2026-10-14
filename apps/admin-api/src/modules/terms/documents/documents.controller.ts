import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { CreateTermCommand } from '#/modules/terms/documents/create-term.command';
import { CreateTermRequestDto } from '#/modules/terms/documents/create-term.request.dto';
import { CreateTermResponseDto } from '#/modules/terms/documents/create-term.response.dto';
import { DeleteTermCommand } from '#/modules/terms/documents/delete-term.command';
import { DeleteTermRequestDto } from '#/modules/terms/documents/delete-term.request.dto';
import { DeleteTermResponseDto } from '#/modules/terms/documents/delete-term.response.dto';
import { GetTermQuery } from '#/modules/terms/documents/get-term.query';
import { GetTermRequestDto } from '#/modules/terms/documents/get-term.request.dto';
import { GetTermResponseDto } from '#/modules/terms/documents/get-term.response.dto';
import { GetTermsQuery } from '#/modules/terms/documents/get-terms.query';
import { GetTermsRequestDto } from '#/modules/terms/documents/get-terms.request.dto';
import { GetTermsResponseDto } from '#/modules/terms/documents/get-terms.response.dto';
import { PublishTermCommand } from '#/modules/terms/documents/publish-term.command';
import { PublishTermRequestDto } from '#/modules/terms/documents/publish-term.request.dto';
import { PublishTermResponseDto } from '#/modules/terms/documents/publish-term.response.dto';
import { UpdateTermCommand } from '#/modules/terms/documents/update-term.command';
import { UpdateTermRequestDto } from '#/modules/terms/documents/update-term.request.dto';
import { UpdateTermResponseDto } from '#/modules/terms/documents/update-term.response.dto';

@ApiTags('terms')
@UserAuth()
@Controller('terms')
export class TermDocumentsController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @Get()
  @Permissions(AdminPermission.terms.read)
  @ApiOperation({ summary: '약관 목록 조회', operationId: 'TermsController_getTerms_v1' })
  @SwaggerApiResponse(GetTermsResponseDto)
  async getTerms(@Query() query: GetTermsRequestDto): Promise<GetTermsResponseDto> {
    return this.queryBus.execute(new GetTermsQuery(query));
  }

  @Post()
  @Permissions(AdminPermission.terms.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '약관 생성', operationId: 'TermsController_createTerm_v1' })
  @SwaggerApiResponse(CreateTermResponseDto, HttpStatus.CREATED)
  async createTerm(@Body() input: CreateTermRequestDto): Promise<CreateTermResponseDto> {
    return this.commandBus.execute(new CreateTermCommand(input));
  }

  @Patch(':id')
  @Permissions(AdminPermission.terms.update)
  @ApiOperation({ summary: '약관 수정', operationId: 'TermsController_updateTerm_v1' })
  @SwaggerApiResponse(UpdateTermResponseDto)
  async updateTerm(@Param('id') id: string, @Body() input: UpdateTermRequestDto): Promise<UpdateTermResponseDto> {
    return this.commandBus.execute(new UpdateTermCommand({ termId: id, data: input }));
  }

  @Post(':id/publish')
  @Permissions(AdminPermission.terms.publish)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 게시', operationId: 'TermsController_publishTerm_v1' })
  @SwaggerApiResponse(PublishTermResponseDto)
  async publishTerm(@Param('id') id: string): Promise<PublishTermResponseDto> {
    return this.commandBus.execute(new PublishTermCommand(PublishTermRequestDto.parse({ termId: id }).validate()));
  }

  @Delete(':id')
  @Permissions(AdminPermission.terms.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 삭제', operationId: 'TermsController_deleteTerm_v1' })
  @SwaggerApiResponse(DeleteTermResponseDto)
  async deleteTerm(@Param('id') id: string): Promise<DeleteTermResponseDto> {
    return this.commandBus.execute(new DeleteTermCommand(DeleteTermRequestDto.parse({ termId: id }).validate()));
  }

  @Get(':termId')
  @ApiOperation({ summary: '게시된 약관 상세 조회', operationId: 'TermsController_getTerm_v1' })
  @SwaggerApiResponse(GetTermResponseDto)
  getTerm(@Param('termId') termId: string): Promise<GetTermResponseDto> {
    return this.queryBus.execute(new GetTermQuery(GetTermRequestDto.parse({ termId }).validate()));
  }
}

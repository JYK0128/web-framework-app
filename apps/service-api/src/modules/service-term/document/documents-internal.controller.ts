import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MachineAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { CreateInternalServiceTermCommand } from '#/modules/service-term/document/create-internal-service-term.command';
import { CreateInternalServiceTermRequestDto } from '#/modules/service-term/document/create-internal-service-term.request.dto';
import { CreateInternalServiceTermResponseDto } from '#/modules/service-term/document/create-internal-service-term.response.dto';
import { DeleteInternalServiceTermCommand } from '#/modules/service-term/document/delete-internal-service-term.command';
import { DeleteInternalServiceTermRequestDto } from '#/modules/service-term/document/delete-internal-service-term.request.dto';
import { DeleteInternalServiceTermResponseDto } from '#/modules/service-term/document/delete-internal-service-term.response.dto';
import { GetInternalServiceTermsQuery } from '#/modules/service-term/document/get-internal-service-terms.query';
import { GetInternalServiceTermsRequestDto } from '#/modules/service-term/document/get-internal-service-terms.request.dto';
import { GetInternalServiceTermsResponseDto } from '#/modules/service-term/document/get-internal-service-terms.response.dto';
import { PublishInternalServiceTermCommand } from '#/modules/service-term/document/publish-internal-service-term.command';
import { PublishInternalServiceTermRequestDto } from '#/modules/service-term/document/publish-internal-service-term.request.dto';
import { PublishInternalServiceTermResponseDto } from '#/modules/service-term/document/publish-internal-service-term.response.dto';
import { UpdateInternalServiceTermCommand } from '#/modules/service-term/document/update-internal-service-term.command';
import { UpdateInternalServiceTermRequestDto } from '#/modules/service-term/document/update-internal-service-term.request.dto';
import { UpdateInternalServiceTermResponseDto } from '#/modules/service-term/document/update-internal-service-term.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/service-terms')
export class InternalServiceTermDocumentsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get() @ApiOperation({ operationId: 'InternalServiceTermsController_list_v1', summary: 'Machine: 서비스 약관 목록 조회' }) @SwaggerApiResponse(GetInternalServiceTermsResponseDto)
  list(@Query() query: GetInternalServiceTermsRequestDto): Promise<GetInternalServiceTermsResponseDto> { return this.queryBus.execute(new GetInternalServiceTermsQuery(query)); }

  @ApiOperation({ summary: undefined, operationId: 'InternalServiceTermsController_create_v1' })
  @Post() @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(CreateInternalServiceTermResponseDto, HttpStatus.CREATED)
  create(@Body() input: CreateInternalServiceTermRequestDto): Promise<CreateInternalServiceTermResponseDto> { return this.commandBus.execute(new CreateInternalServiceTermCommand(input)); }

  @ApiOperation({ summary: undefined, operationId: 'InternalServiceTermsController_update_v1' })
  @Patch(':id') @SwaggerApiResponse(UpdateInternalServiceTermResponseDto)
  update(@Param('id') id: string, @Body() input: UpdateInternalServiceTermRequestDto): Promise<UpdateInternalServiceTermResponseDto> { return this.commandBus.execute(new UpdateInternalServiceTermCommand({ termId: id, dto: input })); }

  @ApiOperation({ summary: undefined, operationId: 'InternalServiceTermsController_publish_v1' })
  @Post(':id/publish') @HttpCode(HttpStatus.OK) @SwaggerApiResponse(PublishInternalServiceTermResponseDto)
  publish(@Param('id') id: string): Promise<PublishInternalServiceTermResponseDto> {
    const request = PublishInternalServiceTermRequestDto.parse({ termId: id }).validate();
    return this.commandBus.execute(new PublishInternalServiceTermCommand(request));
  }

  @ApiOperation({ summary: undefined, operationId: 'InternalServiceTermsController_delete_v1' })
  @Delete(':id') @SwaggerApiResponse(DeleteInternalServiceTermResponseDto)
  delete(@Param('id') id: string): Promise<DeleteInternalServiceTermResponseDto> {
    const request = DeleteInternalServiceTermRequestDto.parse({ termId: id }).validate();
    return this.commandBus.execute(new DeleteInternalServiceTermCommand(request));
  }
}

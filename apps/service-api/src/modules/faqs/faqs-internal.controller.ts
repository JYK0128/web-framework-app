import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MachineAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { CreateFaqCommand } from '#/modules/faqs/create-faq.command';
import { CreateFaqRequestDto } from '#/modules/faqs/create-faq.request.dto';
import { CreateFaqResponseDto } from '#/modules/faqs/create-faq.response.dto';
import { DeleteFaqCommand } from '#/modules/faqs/delete-faq.command';
import { DeleteFaqRequestDto } from '#/modules/faqs/delete-faq.request.dto';
import { DeleteFaqResponseDto } from '#/modules/faqs/delete-faq.response.dto';
import { GetFaqsRequestDto } from '#/modules/faqs/get-faqs.request.dto';
import { GetFaqsResponseDto } from '#/modules/faqs/get-faqs.response.dto';
import { GetInternalFaqsQuery } from '#/modules/faqs/get-internal-faqs.query';
import { UpdateFaqCommand } from '#/modules/faqs/update-faq.command';
import { UpdateFaqRequestDto } from '#/modules/faqs/update-faq.request.dto';
import { UpdateFaqResponseDto } from '#/modules/faqs/update-faq.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/faqs')
export class InternalFaqsController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @ApiOperation({ summary: 'Machine: FAQ 목록 조회 (Control Plane 전용)' })
  @SwaggerApiResponse(GetFaqsResponseDto)
  @Get()
  getFaqs(@Query() query: GetFaqsRequestDto): Promise<GetFaqsResponseDto> {
    return this.queryBus.execute(new GetInternalFaqsQuery(query));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateFaqResponseDto, HttpStatus.CREATED)
  createFaq(@Body() input: CreateFaqRequestDto): Promise<CreateFaqResponseDto> { return this.commandBus.execute(new CreateFaqCommand(input)); }

  @Patch(':id')
  @SwaggerApiResponse(UpdateFaqResponseDto)
  updateFaq(@Param('id') id: string, @Body() input: UpdateFaqRequestDto): Promise<UpdateFaqResponseDto> { return this.commandBus.execute(new UpdateFaqCommand({ faqId: id, dto: input })); }

  @Delete(':id')
  @SwaggerApiResponse(DeleteFaqResponseDto)
  deleteFaq(@Param('id') id: string): Promise<DeleteFaqResponseDto> {
    const request = DeleteFaqRequestDto.parse({ faqId: id }).validate();
    return this.commandBus.execute(new DeleteFaqCommand(request));
  }
}

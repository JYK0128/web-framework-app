import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { FaqListResponseDto, GetFaqsRequestDto } from '#/modules/faqs/dto';
import { GetInternalFaqsQuery } from '#/modules/faqs/queries/get-internal-faqs.query';
import { CreateFaqCommand, DeleteFaqCommand, UpdateFaqCommand } from '#/modules/faqs/commands';
import { CreateFaqRequestDto, FaqItemDto, UpdateFaqRequestDto } from '#/modules/faqs/dto';

@ApiTags('Internal (Machine)')
@MachineAuth()
@Controller('internal/faqs')
export class InternalFaqsController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @ApiOperation({ summary: 'Machine: FAQ 목록 조회 (Control Plane 전용)' })
  @SwaggerApiResponse(FaqListResponseDto)
  @Get()
  getFaqs(@Query() query: GetFaqsRequestDto): Promise<FaqListResponseDto> {
    return this.queryBus.execute(new GetInternalFaqsQuery(query));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(FaqItemDto, HttpStatus.CREATED)
  createFaq(@Body() input: CreateFaqRequestDto): Promise<FaqItemDto> { return this.commandBus.execute(new CreateFaqCommand(input)); }

  @Patch(':id')
  @SwaggerApiResponse(FaqItemDto)
  updateFaq(@Param('id') id: string, @Body() input: UpdateFaqRequestDto): Promise<FaqItemDto> { return this.commandBus.execute(new UpdateFaqCommand({ faqId: id, dto: input })); }

  @Delete(':id')
  @SwaggerApiResponse(Object)
  deleteFaq(@Param('id') id: string): Promise<{ success: boolean }> { return this.commandBus.execute(new DeleteFaqCommand(id)); }
}

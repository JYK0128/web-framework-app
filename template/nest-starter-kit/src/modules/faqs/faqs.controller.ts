import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateFaqCommand, DeleteFaqCommand, MarkHelpfulFaqCommand, UpdateFaqCommand } from './commands';
import { CreateFaqRequestDto, FaqItemDto, GetAdminFaqsRequestDto, GetAdminFaqsResponseDto, GetFaqsRequestDto, GetFaqsResponseDto, UpdateFaqRequestDto } from './dto';
import { GetAdminFaqsQuery, GetFaqsQuery } from './queries';

@ApiTags('faqs')
@Controller('faqs')
export class FaqsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Get()
  @SwaggerApiResponse(GetFaqsResponseDto)
  async getFaqs(@Query() query: GetFaqsRequestDto): Promise<GetFaqsResponseDto> {
    return this.queryBus.execute(new GetFaqsQuery(query));
  }

  @Public()
  @Post(':id/helpful')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(FaqItemDto)
  async markHelpful(@Param('id') id: string): Promise<FaqItemDto> {
    return this.commandBus.execute(new MarkHelpfulFaqCommand(id));
  }

  @Permission('faq:read')
  @Get('admin')
  @SwaggerApiResponse(GetAdminFaqsResponseDto)
  async getAdminFaqs(@Query() query: GetAdminFaqsRequestDto): Promise<GetAdminFaqsResponseDto> {
    return this.queryBus.execute(new GetAdminFaqsQuery(query));
  }

  @Permission('faq:create')
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(FaqItemDto)
  async createFaq(@Body() dto: CreateFaqRequestDto): Promise<FaqItemDto> {
    return this.commandBus.execute(new CreateFaqCommand(dto));
  }

  @Permission('faq:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(FaqItemDto)
  async updateFaq(
    @Param('id') id: string,
    @Body() dto: UpdateFaqRequestDto,
  ): Promise<FaqItemDto> {
    return this.commandBus.execute(new UpdateFaqCommand(id, dto));
  }

  @Permission('faq:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFaq(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteFaqCommand(id));
  }
}

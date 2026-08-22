import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateFaqCommand, DeleteFaqCommand, UpdateFaqCommand } from './commands';
import { CreateFaqRequestDto, CreateFaqResponseDto, DeleteFaqResponseDto, GetAdminFaqsRequestDto, GetAdminFaqsResponseDto, GetFaqsRequestDto, GetFaqsResponseDto, UpdateFaqRequestDto, UpdateFaqResponseDto } from './dto';
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

  @Permission('faq:manage', 'faq:read')
  @Get('admin')
  @SwaggerApiResponse(GetAdminFaqsResponseDto)
  async getAdminFaqs(@Query() query: GetAdminFaqsRequestDto): Promise<GetAdminFaqsResponseDto> {
    return this.queryBus.execute(new GetAdminFaqsQuery(query));
  }

  @Permission('faq:manage', 'faq:create')
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateFaqResponseDto, HttpStatus.CREATED)
  async createFaq(@Body() dto: CreateFaqRequestDto): Promise<CreateFaqResponseDto> {
    return this.commandBus.execute(new CreateFaqCommand(dto));
  }

  @Permission('faq:manage', 'faq:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(UpdateFaqResponseDto)
  async updateFaq(
    @Param('id') id: string,
    @Body() dto: UpdateFaqRequestDto,
  ): Promise<UpdateFaqResponseDto> {
    return this.commandBus.execute(new UpdateFaqCommand({ id, input: dto }));
  }

  @Permission('faq:manage', 'faq:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteFaqResponseDto)
  async deleteFaq(@Param('id') id: string): Promise<DeleteFaqResponseDto> {
    return this.commandBus.execute(new DeleteFaqCommand({ id }));
  }
}

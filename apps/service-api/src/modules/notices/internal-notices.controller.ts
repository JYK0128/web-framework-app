import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateNoticeRequestDto, GetNoticesRequestDto, NoticeActionResponseDto, NoticeItemDto, NoticePageResponseDto, UpdateNoticeRequestDto } from './notices.dto';
import { CreateNoticeCommand, DeleteNoticeCommand, GetNoticesQuery, UpdateNoticeCommand } from './notices.messages';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/notices')
export class InternalNoticesController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @SwaggerApiResponse(NoticePageResponseDto)
  @Get()
  list(@Query() query: GetNoticesRequestDto): Promise<NoticePageResponseDto> { return this.queryBus.execute(new GetNoticesQuery(query)); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(NoticeItemDto, HttpStatus.CREATED)
  create(@Body() input: CreateNoticeRequestDto): Promise<NoticeItemDto> { return this.commandBus.execute(new CreateNoticeCommand(input)); }

  @Patch(':id')
  @SwaggerApiResponse(NoticeItemDto)
  update(@Param('id') id: string, @Body() input: UpdateNoticeRequestDto): Promise<NoticeItemDto> { return this.commandBus.execute(new UpdateNoticeCommand(id, input)); }

  @Delete(':id')
  @SwaggerApiResponse(NoticeActionResponseDto)
  remove(@Param('id') id: string): Promise<NoticeActionResponseDto> { return this.commandBus.execute(new DeleteNoticeCommand(id)); }
}

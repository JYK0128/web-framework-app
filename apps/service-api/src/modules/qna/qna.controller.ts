import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateQnaRequestDto, GetQnaRequestDto, QnaActionResponseDto, QnaItemDto, QnaListResponseDto, UpdateOwnQnaRequestDto } from './dto/qna.dto';
import { CreateOwnQnaCommand, DeleteOwnQnaCommand, GetOwnQnaQuery, GetOwnQnasQuery, UpdateOwnQnaCommand } from './qna.cqrs';

@ApiTags('qna') @UserAuth() @Controller('qna')
export class QnaController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}
  @Get() @SwaggerApiResponse(QnaListResponseDto) list(@Query() query: GetQnaRequestDto) { return this.queryBus.execute(new GetOwnQnasQuery(query)); }
  @Post() @SwaggerApiResponse(QnaItemDto) create(@Body() input: CreateQnaRequestDto) { return this.commandBus.execute(new CreateOwnQnaCommand(input)); }
  @Get(':id') @SwaggerApiResponse(QnaItemDto) get(@Param('id') id: string) { return this.queryBus.execute(new GetOwnQnaQuery({ qnaId: id })); }
  @Patch(':id') @SwaggerApiResponse(QnaItemDto) update(@Param('id') id: string, @Body() input: UpdateOwnQnaRequestDto) { return this.commandBus.execute(new UpdateOwnQnaCommand({ qnaId: id, dto: input })); }
  @Delete(':id') @SwaggerApiResponse(QnaActionResponseDto) remove(@Param('id') id: string) { return this.commandBus.execute(new DeleteOwnQnaCommand({ qnaId: id })); }
}

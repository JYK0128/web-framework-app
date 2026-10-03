import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { GetQnaRequestDto, QnaActionResponseDto, QnaItemDto, QnaPageResponseDto, UpdateQnaRequestDto } from './dto/qna.dto';
import { DeleteQnaCommand, GetAllQnaQuery, GetAllQnasQuery, UpdateQnaCommand } from './qna.cqrs';

@ApiTags('Internal (Machine)') @ApiExcludeController() @MachineAuth() @Controller('internal/qna')
export class QnaInternalController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}
  @Get() @SwaggerApiResponse(QnaPageResponseDto) list(@Query() query: GetQnaRequestDto) { return this.queryBus.execute(new GetAllQnasQuery(query)); }
  @Get(':id') @SwaggerApiResponse(QnaItemDto) get(@Param('id') id: string) { return this.queryBus.execute(new GetAllQnaQuery({ qnaId: id })); }
  @Patch(':id') @SwaggerApiResponse(QnaItemDto) update(@Param('id') id: string, @Body() input: UpdateQnaRequestDto) { return this.commandBus.execute(new UpdateQnaCommand({ qnaId: id, dto: input })); }
  @Delete(':id') @SwaggerApiResponse(QnaActionResponseDto) remove(@Param('id') id: string) { return this.commandBus.execute(new DeleteQnaCommand({ qnaId: id })); }
}

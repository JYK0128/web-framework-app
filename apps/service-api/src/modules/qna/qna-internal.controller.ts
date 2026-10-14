import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { MachineAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { DeleteQnaCommand } from '#/modules/qna/delete-qna.command';
import { DeleteQnaRequestDto } from '#/modules/qna/delete-qna.request.dto';
import { DeleteQnaResponseDto } from '#/modules/qna/delete-qna.response.dto';
import { GetAllQnaQuery } from '#/modules/qna/get-all-qna.query';
import { GetAllQnasQuery } from '#/modules/qna/get-all-qnas.query';
import { GetQnaRequestDto } from '#/modules/qna/get-qna.request.dto';
import { GetQnaResponseDto } from '#/modules/qna/get-qna.response.dto';
import { GetQnasRequestDto } from '#/modules/qna/get-qnas.request.dto';
import { GetQnasResponseDto } from '#/modules/qna/get-qnas.response.dto';
import { UpdateQnaCommand } from '#/modules/qna/update-qna.command';
import { UpdateQnaRequestDto } from '#/modules/qna/update-qna.request.dto';
import { UpdateQnaResponseDto } from '#/modules/qna/update-qna.response.dto';

@ApiTags('Internal (Machine)') @ApiExcludeController() @MachineAuth() @Controller('internal/qna')
export class QnaInternalController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}
  @Get() @SwaggerApiResponse(GetQnasResponseDto) list(@Query() query: GetQnasRequestDto): Promise<GetQnasResponseDto> { return this.queryBus.execute(new GetAllQnasQuery(query)); }
  @Get(':id') @SwaggerApiResponse(GetQnaResponseDto) get(@Param('id') id: string): Promise<GetQnaResponseDto> {
    const request = GetQnaRequestDto.parse({ qnaId: id }).validate();
    return this.queryBus.execute(new GetAllQnaQuery(request));
  }

  @Patch(':id') @SwaggerApiResponse(UpdateQnaResponseDto) update(@Param('id') id: string, @Body() input: UpdateQnaRequestDto): Promise<UpdateQnaResponseDto> { return this.commandBus.execute(new UpdateQnaCommand({ qnaId: id, dto: input })); }
  @Delete(':id') @SwaggerApiResponse(DeleteQnaResponseDto) remove(@Param('id') id: string): Promise<DeleteQnaResponseDto> {
    const request = DeleteQnaRequestDto.parse({ qnaId: id }).validate();
    return this.commandBus.execute(new DeleteQnaCommand(request));
  }
}

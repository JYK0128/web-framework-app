import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { CreateOwnQnaCommand } from '#/modules/qna/create-own-qna.command';
import { CreateQnaRequestDto } from '#/modules/qna/create-qna.request.dto';
import { CreateQnaResponseDto } from '#/modules/qna/create-qna.response.dto';
import { DeleteOwnQnaCommand } from '#/modules/qna/delete-own-qna.command';
import { DeleteOwnQnaRequestDto } from '#/modules/qna/delete-own-qna.request.dto';
import { DeleteOwnQnaResponseDto } from '#/modules/qna/delete-own-qna.response.dto';
import { GetOwnQnaQuery } from '#/modules/qna/get-own-qna.query';
import { GetOwnQnaRequestDto } from '#/modules/qna/get-own-qna.request.dto';
import { GetOwnQnaResponseDto } from '#/modules/qna/get-own-qna.response.dto';
import { GetOwnQnasQuery } from '#/modules/qna/get-own-qnas.query';
import { GetQnasRequestDto } from '#/modules/qna/get-qnas.request.dto';
import { GetQnasResponseDto } from '#/modules/qna/get-qnas.response.dto';
import { UpdateOwnQnaCommand } from '#/modules/qna/update-own-qna.command';
import { UpdateOwnQnaRequestDto } from '#/modules/qna/update-own-qna.request.dto';
import { UpdateOwnQnaResponseDto } from '#/modules/qna/update-own-qna.response.dto';

@ApiTags('qna') @UserAuth() @Controller('qna')
export class QnaController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}
  @Get() @SwaggerApiResponse(GetQnasResponseDto) list(@Query() query: GetQnasRequestDto): Promise<GetQnasResponseDto> { return this.queryBus.execute(new GetOwnQnasQuery(query)); }
  @Post() @SwaggerApiResponse(CreateQnaResponseDto) create(@Body() input: CreateQnaRequestDto): Promise<CreateQnaResponseDto> { return this.commandBus.execute(new CreateOwnQnaCommand(input)); }
  @Get(':id') @SwaggerApiResponse(GetOwnQnaResponseDto) get(@Param('id') id: string): Promise<GetOwnQnaResponseDto> {
    const request = GetOwnQnaRequestDto.parse({ qnaId: id }).validate();
    return this.queryBus.execute(new GetOwnQnaQuery(request));
  }

  @Patch(':id') @SwaggerApiResponse(UpdateOwnQnaResponseDto) update(@Param('id') id: string, @Body() input: UpdateOwnQnaRequestDto): Promise<UpdateOwnQnaResponseDto> { return this.commandBus.execute(new UpdateOwnQnaCommand({ qnaId: id, dto: input })); }
  @Delete(':id') @SwaggerApiResponse(DeleteOwnQnaResponseDto) remove(@Param('id') id: string): Promise<DeleteOwnQnaResponseDto> {
    const request = DeleteOwnQnaRequestDto.parse({ qnaId: id }).validate();
    return this.commandBus.execute(new DeleteOwnQnaCommand(request));
  }
}

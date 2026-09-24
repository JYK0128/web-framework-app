import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateQnaRequestDto, GetQnaRequestDto, QnaActionResponseDto, QnaItemDto, QnaListResponseDto, UpdateOwnQnaRequestDto } from './dto/qna.dto';
import { QnaService } from './qna.service';

@ApiTags('qna') @UserAuth() @Controller('qna')
export class QnaController {
  constructor(private readonly service: QnaService) {}
  @Get() @SwaggerApiResponse(QnaListResponseDto) list(@Query() query: GetQnaRequestDto) { return this.service.list(query); }
  @Post() @SwaggerApiResponse(QnaItemDto) create(@Body() input: CreateQnaRequestDto) { return this.service.create(input); }
  @Get(':id') @SwaggerApiResponse(QnaItemDto) get(@Param('id') id: string) { return this.service.get(id); }
  @Patch(':id') @SwaggerApiResponse(QnaItemDto) update(@Param('id') id: string, @Body() input: UpdateOwnQnaRequestDto) { return this.service.update(id, input, true); }
  @Delete(':id') @SwaggerApiResponse(QnaActionResponseDto) remove(@Param('id') id: string) { return this.service.remove(id, true); }
}

import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { GetQnaRequestDto, QnaActionResponseDto, QnaItemDto, QnaListResponseDto, UpdateQnaRequestDto } from './dto/qna.dto';
import { QnaService } from './qna.service';

@ApiTags('Internal (Machine)') @ApiExcludeController() @MachineAuth() @Controller('internal/qna')
export class QnaInternalController {
  constructor(private readonly service: QnaService) {}
  @Get() @SwaggerApiResponse(QnaListResponseDto) list(@Query() query: GetQnaRequestDto) { return this.service.list(query, false); }
  @Get(':id') @SwaggerApiResponse(QnaItemDto) get(@Param('id') id: string) { return this.service.get(id, false); }
  @Patch(':id') @SwaggerApiResponse(QnaItemDto) update(@Param('id') id: string, @Body() input: UpdateQnaRequestDto) { return this.service.update(id, input); }
  @Delete(':id') @SwaggerApiResponse(QnaActionResponseDto) remove(@Param('id') id: string) { return this.service.remove(id); }
}

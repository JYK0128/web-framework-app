import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { MachineAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { CreateNoticeCommand } from '#/modules/notices/create-notice.command';
import { CreateNoticeRequestDto } from '#/modules/notices/create-notice.request.dto';
import { CreateNoticeResponseDto } from '#/modules/notices/create-notice.response.dto';
import { DeleteNoticeCommand } from '#/modules/notices/delete-notice.command';
import { DeleteNoticeRequestDto } from '#/modules/notices/delete-notice.request.dto';
import { DeleteNoticeResponseDto } from '#/modules/notices/delete-notice.response.dto';
import { GetNoticesQuery } from '#/modules/notices/get-notices.query';
import { GetNoticesRequestDto } from '#/modules/notices/get-notices.request.dto';
import { GetNoticesResponseDto } from '#/modules/notices/get-notices.response.dto';
import { UpdateNoticeCommand } from '#/modules/notices/update-notice.command';
import { UpdateNoticeRequestDto } from '#/modules/notices/update-notice.request.dto';
import { UpdateNoticeResponseDto } from '#/modules/notices/update-notice.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/notices')
export class InternalNoticesController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @SwaggerApiResponse(GetNoticesResponseDto)
  @Get()
  list(@Query() query: GetNoticesRequestDto): Promise<GetNoticesResponseDto> { return this.queryBus.execute(new GetNoticesQuery(query)); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateNoticeResponseDto, HttpStatus.CREATED)
  create(@Body() input: CreateNoticeRequestDto): Promise<CreateNoticeResponseDto> { return this.commandBus.execute(new CreateNoticeCommand(input)); }

  @Patch(':id')
  @SwaggerApiResponse(UpdateNoticeResponseDto)
  update(@Param('id') id: string, @Body() input: UpdateNoticeRequestDto): Promise<UpdateNoticeResponseDto> { return this.commandBus.execute(new UpdateNoticeCommand(id, input)); }

  @Delete(':id')
  @SwaggerApiResponse(DeleteNoticeResponseDto)
  remove(@Param('id') id: string): Promise<DeleteNoticeResponseDto> {
    const request = DeleteNoticeRequestDto.parse({ noticeId: id }).validate();
    return this.commandBus.execute(new DeleteNoticeCommand(request));
  }
}

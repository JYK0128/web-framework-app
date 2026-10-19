import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { MachineAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { CreateEventCommand } from '#/modules/event/create-event.command';
import { CreateEventRequestDto } from '#/modules/event/create-event.request.dto';
import { CreateEventResponseDto } from '#/modules/event/create-event.response.dto';
import { DeleteEventCommand } from '#/modules/event/delete-event.command';
import { DeleteEventRequestDto } from '#/modules/event/delete-event.request.dto';
import { DeleteEventResponseDto } from '#/modules/event/delete-event.response.dto';
import { GetEventsQuery } from '#/modules/event/get-events.query';
import { GetEventsRequestDto } from '#/modules/event/get-events.request.dto';
import { GetEventsResponseDto } from '#/modules/event/get-events.response.dto';
import { UpdateEventCommand } from '#/modules/event/update-event.command';
import { UpdateEventRequestDto } from '#/modules/event/update-event.request.dto';
import { UpdateEventResponseDto } from '#/modules/event/update-event.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/events')
export class InternalEventsController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}
  @SwaggerApiResponse(GetEventsResponseDto)
  @Get()
  list(@Query() query: GetEventsRequestDto): Promise<GetEventsResponseDto> { return this.queryBus.execute(new GetEventsQuery(query)); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateEventResponseDto, HttpStatus.CREATED)
  create(@Body() input: CreateEventRequestDto): Promise<CreateEventResponseDto> { return this.commandBus.execute(new CreateEventCommand(input)); }

  @Patch(':id')
  @SwaggerApiResponse(UpdateEventResponseDto)
  update(@Param('id') id: string, @Body() input: UpdateEventRequestDto): Promise<UpdateEventResponseDto> { return this.commandBus.execute(new UpdateEventCommand(id, input)); }

  @Delete(':id')
  @SwaggerApiResponse(DeleteEventResponseDto)
  remove(@Param('id') id: string): Promise<DeleteEventResponseDto> {
    const request = DeleteEventRequestDto.parse({ eventId: id }).validate();
    return this.commandBus.execute(new DeleteEventCommand(request));
  }
}

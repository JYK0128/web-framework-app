import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateEventRequestDto, EventActionResponseDto, EventItemDto, EventPageResponseDto, GetEventsRequestDto, UpdateEventRequestDto } from './events.dto';
import { CreateEventCommand, DeleteEventCommand, GetEventsQuery, UpdateEventCommand } from './events.messages';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/events')
export class InternalEventsController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}
  @SwaggerApiResponse(EventPageResponseDto)
  @Get()
  list(@Query() query: GetEventsRequestDto): Promise<EventPageResponseDto> { return this.queryBus.execute(new GetEventsQuery(query)); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(EventItemDto, HttpStatus.CREATED)
  create(@Body() input: CreateEventRequestDto): Promise<EventItemDto> { return this.commandBus.execute(new CreateEventCommand(input)); }

  @Patch(':id')
  @SwaggerApiResponse(EventItemDto)
  update(@Param('id') id: string, @Body() input: UpdateEventRequestDto): Promise<EventItemDto> { return this.commandBus.execute(new UpdateEventCommand(id, input)); }

  @Delete(':id')
  @SwaggerApiResponse(EventActionResponseDto)
  remove(@Param('id') id: string): Promise<EventActionResponseDto> { return this.commandBus.execute(new DeleteEventCommand(id)); }
}

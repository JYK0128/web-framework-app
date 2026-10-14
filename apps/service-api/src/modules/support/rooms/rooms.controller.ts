import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { CreateSupportRoomCommand } from '#/modules/support/rooms/create-support-room.command';
import { CreateSupportRoomRequestDto } from '#/modules/support/rooms/create-support-room.request.dto';
import { CreateSupportRoomResponseDto } from '#/modules/support/rooms/create-support-room.response.dto';
import { GetOwnSupportRoomQuery } from '#/modules/support/rooms/get-own-support-room.query';
import { GetOwnSupportRoomsQuery } from '#/modules/support/rooms/get-own-support-rooms.query';
import { GetSupportRoomRequestDto } from '#/modules/support/rooms/get-support-room.request.dto';
import { GetSupportRoomResponseDto } from '#/modules/support/rooms/get-support-room.response.dto';
import { GetSupportRoomsCursorRequestDto } from '#/modules/support/rooms/get-support-rooms-cursor.request.dto';
import { GetSupportRoomsCursorResponseDto } from '#/modules/support/rooms/get-support-rooms-cursor.response.dto';
import { UpdateOwnSupportRoomCommand } from '#/modules/support/rooms/update-own-support-room.command';
import { UpdateSupportRoomRequestDto } from '#/modules/support/rooms/update-support-room.request.dto';
import { UpdateSupportRoomResponseDto } from '#/modules/support/rooms/update-support-room.response.dto';

@ApiTags('support')
@UserAuth()
@Controller('support')
export class SupportRoomsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: undefined, operationId: 'SupportController_listRooms_v1' })
  @Get('rooms') @SwaggerApiResponse(GetSupportRoomsCursorResponseDto)
  listRooms(@Query() query: GetSupportRoomsCursorRequestDto): Promise<GetSupportRoomsCursorResponseDto> { return this.queryBus.execute(new GetOwnSupportRoomsQuery(query)); }

  @ApiOperation({ summary: undefined, operationId: 'SupportController_createRoom_v1' })
  @Post('rooms') @SwaggerApiResponse(CreateSupportRoomResponseDto)
  createRoom(@Body() input: CreateSupportRoomRequestDto): Promise<CreateSupportRoomResponseDto> { return this.commandBus.execute(new CreateSupportRoomCommand(input)); }

  @ApiOperation({ summary: undefined, operationId: 'SupportController_getRoom_v1' })
  @Get('rooms/:roomId') @SwaggerApiResponse(GetSupportRoomResponseDto)
  getRoom(@Param('roomId') roomId: string): Promise<GetSupportRoomResponseDto> {
    const request = GetSupportRoomRequestDto.parse({ roomId }).validate();
    return this.queryBus.execute(new GetOwnSupportRoomQuery(request));
  }

  @ApiOperation({ summary: undefined, operationId: 'SupportController_updateRoom_v1' })
  @Patch('rooms/:roomId') @SwaggerApiResponse(UpdateSupportRoomResponseDto)
  updateRoom(@Param('roomId') roomId: string, @Body() input: UpdateSupportRoomRequestDto): Promise<UpdateSupportRoomResponseDto> { return this.commandBus.execute(new UpdateOwnSupportRoomCommand({ roomId, dto: input })); }
}

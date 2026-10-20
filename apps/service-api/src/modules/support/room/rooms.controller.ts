import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { ServicePermission } from '@pkg/shared';

import { CreateSupportRoomCommand } from '#/modules/support/room/create-support-room.command';
import { CreateSupportRoomRequestDto } from '#/modules/support/room/create-support-room.request.dto';
import { CreateSupportRoomResponseDto } from '#/modules/support/room/create-support-room.response.dto';
import { GetOwnSupportRoomQuery } from '#/modules/support/room/get-own-support-room.query';
import { GetOwnSupportRoomsQuery } from '#/modules/support/room/get-own-support-rooms.query';
import { GetSupportRoomRequestDto } from '#/modules/support/room/get-support-room.request.dto';
import { GetSupportRoomResponseDto } from '#/modules/support/room/get-support-room.response.dto';
import { GetSupportRoomsCursorRequestDto } from '#/modules/support/room/get-support-rooms-cursor.request.dto';
import { GetSupportRoomsCursorResponseDto } from '#/modules/support/room/get-support-rooms-cursor.response.dto';
import { UpdateOwnSupportRoomCommand } from '#/modules/support/room/update-own-support-room.command';
import { UpdateSupportRoomRequestDto } from '#/modules/support/room/update-support-room.request.dto';
import { UpdateSupportRoomResponseDto } from '#/modules/support/room/update-support-room.response.dto';

@ApiTags('support')
@UserAuth()
@Controller('support')
export class SupportRoomsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: undefined, operationId: 'SupportController_listRooms_v1' })
  @Get('rooms') @Permissions(ServicePermission.support.read) @SwaggerApiResponse(GetSupportRoomsCursorResponseDto)
  listRooms(@Query() query: GetSupportRoomsCursorRequestDto): Promise<GetSupportRoomsCursorResponseDto> { return this.queryBus.execute(new GetOwnSupportRoomsQuery(query)); }

  @ApiOperation({ summary: undefined, operationId: 'SupportController_createRoom_v1' })
  @Post('rooms') @Permissions(ServicePermission.support.create) @SwaggerApiResponse(CreateSupportRoomResponseDto)
  createRoom(@Body() input: CreateSupportRoomRequestDto): Promise<CreateSupportRoomResponseDto> { return this.commandBus.execute(new CreateSupportRoomCommand(input)); }

  @ApiOperation({ summary: undefined, operationId: 'SupportController_getRoom_v1' })
  @Get('rooms/:roomId') @Permissions(ServicePermission.support.read) @SwaggerApiResponse(GetSupportRoomResponseDto)
  getRoom(@Param('roomId') roomId: string): Promise<GetSupportRoomResponseDto> {
    const request = GetSupportRoomRequestDto.parse({ roomId }).validate();
    return this.queryBus.execute(new GetOwnSupportRoomQuery(request));
  }

  @ApiOperation({ summary: undefined, operationId: 'SupportController_updateRoom_v1' })
  @Patch('rooms/:roomId') @Permissions(ServicePermission.support.update) @SwaggerApiResponse(UpdateSupportRoomResponseDto)
  updateRoom(@Param('roomId') roomId: string, @Body() input: UpdateSupportRoomRequestDto): Promise<UpdateSupportRoomResponseDto> { return this.commandBus.execute(new UpdateOwnSupportRoomCommand({ roomId, dto: input })); }
}

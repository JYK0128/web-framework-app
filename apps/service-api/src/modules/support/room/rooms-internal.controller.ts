import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MachineAuth, SwaggerApiResponse } from '@pkg/server-core/http/decorators';

import { GetSupportRoomQuery } from '~/modules/support/room/get-support-room.query';
import { GetSupportRoomRequestDto } from '~/modules/support/room/get-support-room.request.dto';
import { GetSupportRoomResponseDto } from '~/modules/support/room/get-support-room.response.dto';
import { GetSupportRoomsQuery } from '~/modules/support/room/get-support-rooms.query';
import { GetSupportRoomsRequestDto } from '~/modules/support/room/get-support-rooms.request.dto';
import { GetSupportRoomsResponseDto } from '~/modules/support/room/get-support-rooms.response.dto';
import { UpdateSupportRoomCommand } from '~/modules/support/room/update-support-room.command';
import { UpdateSupportRoomRequestDto } from '~/modules/support/room/update-support-room.request.dto';
import { UpdateSupportRoomResponseDto } from '~/modules/support/room/update-support-room.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/support')
export class SupportInternalRoomsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: undefined, operationId: 'SupportInternalController_listRooms_v1' })
  @Get('rooms') @SwaggerApiResponse(GetSupportRoomsResponseDto)
  listRooms(@Query() query: GetSupportRoomsRequestDto): Promise<GetSupportRoomsResponseDto> { return this.queryBus.execute(new GetSupportRoomsQuery(query)); }

  @ApiOperation({ summary: undefined, operationId: 'SupportInternalController_getRoom_v1' })
  @Get('rooms/:roomId') @SwaggerApiResponse(GetSupportRoomResponseDto)
  getRoom(@Param('roomId') roomId: string): Promise<GetSupportRoomResponseDto> {
    const request = GetSupportRoomRequestDto.parse({ roomId }).validate();
    return this.queryBus.execute(new GetSupportRoomQuery(request));
  }

  @ApiOperation({ summary: undefined, operationId: 'SupportInternalController_updateRoom_v1' })
  @Patch('rooms/:roomId') @SwaggerApiResponse(UpdateSupportRoomResponseDto)
  updateRoom(@Param('roomId') roomId: string, @Body() input: UpdateSupportRoomRequestDto): Promise<UpdateSupportRoomResponseDto> { return this.commandBus.execute(new UpdateSupportRoomCommand({ roomId, dto: input })); }
}

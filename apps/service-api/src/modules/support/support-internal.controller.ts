import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateSupportMessageRequestDto, GetSupportRoomsRequestDto, SupportMessageItemDto, SupportMessageListResponseDto, SupportRoomItemDto, SupportRoomListResponseDto, UpdateSupportRoomRequestDto } from './dto';
import { SupportService } from './support.service';

@ApiTags('Internal (Machine)') @ApiExcludeController() @MachineAuth() @Controller('internal/support')
export class SupportInternalController {
  constructor(private readonly service: SupportService) {}

  @Get('rooms') @SwaggerApiResponse(SupportRoomListResponseDto)
  listRooms(@Query() query: GetSupportRoomsRequestDto) { return this.service.listRooms(query, false); }

  @Get('rooms/:roomId') @SwaggerApiResponse(SupportRoomItemDto)
  getRoom(@Param('roomId') roomId: string) { return this.service.getRoom(roomId, false); }

  @Get('rooms/:roomId/messages') @SwaggerApiResponse(SupportMessageListResponseDto)
  async listMessages(@Param('roomId') roomId: string) { return { items: await this.service.listMessages(roomId, false) }; }

  @Post('rooms/:roomId/messages') @SwaggerApiResponse(SupportMessageItemDto)
  createMessage(@Param('roomId') roomId: string, @Body() input: CreateSupportMessageRequestDto) { return this.service.createAgentMessage(roomId, input); }

  @Patch('rooms/:roomId') @SwaggerApiResponse(SupportRoomItemDto)
  updateRoom(@Param('roomId') roomId: string, @Body() input: UpdateSupportRoomRequestDto) { return this.service.updateRoom(roomId, input); }
}

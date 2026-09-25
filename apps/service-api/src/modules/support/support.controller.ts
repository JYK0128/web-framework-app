import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateSupportMessageRequestDto, CreateSupportRoomRequestDto, GetSupportRoomsRequestDto, SupportMessageItemDto, SupportMessageListResponseDto, SupportRoomItemDto, SupportRoomListResponseDto, UpdateSupportRoomRequestDto } from './dto';
import { SupportService } from './support.service';

@ApiTags('support') @UserAuth() @Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Get('rooms') @SwaggerApiResponse(SupportRoomListResponseDto)
  listRooms(@Query() query: GetSupportRoomsRequestDto) { return this.service.listRooms(query, true); }

  @Post('rooms') @SwaggerApiResponse(SupportRoomItemDto)
  createRoom(@Body() input: CreateSupportRoomRequestDto) { return this.service.createRoom(input); }

  @Get('rooms/:roomId') @SwaggerApiResponse(SupportRoomItemDto)
  getRoom(@Param('roomId') roomId: string) { return this.service.getRoom(roomId, true); }

  @Get('rooms/:roomId/messages') @SwaggerApiResponse(SupportMessageListResponseDto)
  async listMessages(@Param('roomId') roomId: string) { return { items: await this.service.listMessages(roomId, true) }; }

  @Post('rooms/:roomId/messages') @SwaggerApiResponse(SupportMessageItemDto)
  createMessage(@Param('roomId') roomId: string, @Body() input: CreateSupportMessageRequestDto) { return this.service.createUserMessage(roomId, input); }

  @Patch('rooms/:roomId') @SwaggerApiResponse(SupportRoomItemDto)
  updateRoom(@Param('roomId') roomId: string, @Body() input: UpdateSupportRoomRequestDto) { return this.service.updateRoom(roomId, input); }
}

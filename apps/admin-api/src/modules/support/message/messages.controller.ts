import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';

import { InternalClient } from '~/core/internal-client';
import { CreateSupportMessageRequestDto } from '~/modules/support/message/create-support-message.request.dto';
import { CreateSupportMessageResponseDto } from '~/modules/support/message/create-support-message.response.dto';
import { GetSupportMessagePiiListRequestDto } from '~/modules/support/message/get-support-message-pii-list.request.dto';
import { GetSupportMessagePiiListResponseDto } from '~/modules/support/message/get-support-message-pii-list.response.dto';
import { GetSupportMessagesRequestDto } from '~/modules/support/message/get-support-messages.request.dto';
import { GetSupportMessagesResponseDto } from '~/modules/support/message/get-support-messages.response.dto';
import { maskMessages } from '~/modules/support/support.helper';

@ApiTags('support')
@UserAuth()
@Controller('support')
export class SupportMessagesController {
  constructor(private readonly internalClient: InternalClient) {}

  @ApiOperation({ summary: undefined, operationId: 'SupportController_listMessages_v1' })
  @Get('rooms/:roomId/messages') @Permissions(AdminPermission.support.read) @SwaggerApiResponse(GetSupportMessagesResponseDto)
  async listMessages(@Param('roomId') roomId: string): Promise<GetSupportMessagesResponseDto> {
    const request = GetSupportMessagesRequestDto.parse({ roomId }).validate();
    const messages = await this.internalClient.fetch<GetSupportMessagesResponseDto>(`/internal/support/rooms/${request.roomId}/messages`);
    return maskMessages(messages);
  }

  @ApiOperation({ summary: '고객지원 채팅 원문 조회', operationId: 'SupportController_listMessagePii_v1' })
  @Get('rooms/:roomId/messages/pii') @Permissions(AdminPermission.support.piiRead) @SwaggerApiResponse(GetSupportMessagePiiListResponseDto)
  listMessagePii(@Param('roomId') roomId: string): Promise<GetSupportMessagePiiListResponseDto> {
    const request = GetSupportMessagePiiListRequestDto.parse({ roomId }).validate();
    return this.internalClient.fetch(`/internal/support/rooms/${request.roomId}/messages`);
  }

  @ApiOperation({ summary: undefined, operationId: 'SupportController_createMessage_v1' })
  @Post('rooms/:roomId/messages') @Permissions(AdminPermission.support.update) @SwaggerApiResponse(CreateSupportMessageResponseDto)
  createMessage(@Param('roomId') roomId: string, @Body() input: CreateSupportMessageRequestDto): Promise<CreateSupportMessageResponseDto> { return this.internalClient.fetch(`/internal/support/rooms/${roomId}/messages`, { method: 'POST', body: input }); }
}

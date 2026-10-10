import { Body, Controller, Get, type MessageEvent, Param, Patch, Post, Query, Sse } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';
import { maskEmail, maskName, maskPhone } from '@pkg/shared/common';
import type { Observable } from 'rxjs';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InternalServiceClient } from '#/infra/auth/machine/internal-service-client.service';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { RealtimeService } from '#/infra/realtime/realtime.service';

import { CreateSupportMessageRequestDto, GetSupportRoomsRequestDto, SupportMessageItemDto, SupportMessageListResponseDto, SupportRoomItemDto, SupportRoomPageResponseDto, SupportSocketTicketResponseDto, UpdateSupportRoomRequestDto } from './dto';

const SUPPORT_UNANSWERED_TOPIC = 'support:unanswered';

function isAsciiAlphanumeric(character: string): boolean {
  const code = character.charCodeAt(0);
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function findEmailLocalStart(content: string, at: number): number {
  let start = at;
  while (start > 0 && (isAsciiAlphanumeric(content[start - 1]) || '._%+-'.includes(content[start - 1]))) start -= 1;
  return start < at && content[start] !== '.' ? start : -1;
}

function isValidDomainLabel(content: string, start: number, end: number, minLength = 1): boolean {
  return end - start >= minLength && content[start] !== '-' && content[end - 1] !== '-';
}

function isDomainSeparator(content: string, position: number): boolean {
  const next = content[position + 1];
  return position + 1 < content.length && (isAsciiAlphanumeric(next) || next === '-');
}

function findEmailDomainEnd(content: string, start: number): number {
  let end = start;
  let labelStart = start;
  let dotCount = 0;

  while (end < content.length) {
    const character = content[end];
    if (isAsciiAlphanumeric(character)) {
      end += 1;
      continue;
    }
    if (character === '-') {
      if (end === labelStart) return -1;
      end += 1;
      continue;
    }
    if (character !== '.') break;
    if (!isDomainSeparator(content, end)) break;
    if (!isValidDomainLabel(content, labelStart, end)) return -1;
    dotCount += 1;
    labelStart = end + 1;
    end += 1;
  }

  if (dotCount === 0 || !isValidDomainLabel(content, labelStart, end, 2)) return -1;
  return end;
}

function maskEmails(content: string): string {
  let output = '';
  let copiedUntil = 0;

  for (let at = content.indexOf('@'); at !== -1; at = content.indexOf('@', at + 1)) {
    const start = findEmailLocalStart(content, at);
    if (start < 0) continue;
    const end = findEmailDomainEnd(content, at + 1);
    if (end < 0) continue;
    output += content.slice(copiedUntil, start) + maskEmail(content.slice(start, end));
    copiedUntil = end;
  }

  return output + content.slice(copiedUntil);
}

function maskMessageContent(content: string): string {
  return maskEmails(content)
    .replace(/(?<!\d)(?:\+82[- ]?)?0\d{1,2}[- ]?\d{3,4}[- ]?\d{4}(?!\d)/g, (phone) => maskPhone(phone))
    .replace(/(?<!\d)\d{6}[- ]?[1-4]\d{6}(?!\d)/g, '******-*******')
    .replace(/((?:이름|성함|실명)[은는:]? *)([가-힣]{2,4})(?![가-힣])/g, (_match, label: string, name: string) => `${label}${maskName(name)}`);
}

function maskMessages(response: SupportMessageListResponseDto): SupportMessageListResponseDto {
  return {
    ...response,
    items: response.items.map((message) => ({
      ...message,
      senderName: message.senderType === 'user' ? maskName(message.senderName) : message.senderName,
      content: maskMessageContent(message.content),
    })),
  };
}

function maskRoom(room: SupportRoomItemDto): SupportRoomItemDto {
  return { ...room, title: maskMessageContent(room.title), userName: maskName(room.userName) };
}

@ApiTags('support') @UserAuth() @Controller('support')
export class SupportController {
  constructor(private readonly internalClient: InternalServiceClient, private readonly realtime: RealtimeService, private readonly kvStore: KvStore) {}

  @Sse('notifications/events') @Permissions(AdminPermission.support.read)
  notifications(): Observable<MessageEvent> {
    return this.realtime.streamSSE(SUPPORT_UNANSWERED_TOPIC);
  }

  @Get('rooms') @Permissions(AdminPermission.support.read) @SwaggerApiResponse(SupportRoomPageResponseDto)
  async listRooms(@Query() query: GetSupportRoomsRequestDto): Promise<SupportRoomPageResponseDto> {
    const result = await this.internalClient.fetch<SupportRoomPageResponseDto>(`/internal/support/rooms?${this.params(query)}`);
    return { ...result, items: result.items.map(maskRoom) };
  }

  @ApiOperation({ summary: '고객지원 상담방 개인정보 원문 목록 조회' })
  @Get('rooms/pii') @Permissions(AdminPermission.support.piiRead) @SwaggerApiResponse(SupportRoomPageResponseDto)
  listRoomPii(@Query() query: GetSupportRoomsRequestDto): Promise<SupportRoomPageResponseDto> {
    return this.internalClient.fetch(`/internal/support/rooms?${this.params(query)}`);
  }

  @Get('rooms/:roomId') @Permissions(AdminPermission.support.read) @SwaggerApiResponse(SupportRoomItemDto)
  async getRoom(@Param('roomId') roomId: string): Promise<SupportRoomItemDto> {
    const result = await this.internalClient.fetch<SupportRoomItemDto>(`/internal/support/rooms/${roomId}`);
    return maskRoom(result);
  }

  @Get('rooms/:roomId/messages') @Permissions(AdminPermission.support.read) @SwaggerApiResponse(SupportMessageListResponseDto)
  async listMessages(@Param('roomId') roomId: string): Promise<SupportMessageListResponseDto> {
    const messages = await this.internalClient.fetch<SupportMessageListResponseDto>(`/internal/support/rooms/${roomId}/messages`);
    return maskMessages(messages);
  }

  @Post('rooms/:roomId/socket-ticket') @Permissions(AdminPermission.support.read)
  @SwaggerApiResponse(SupportSocketTicketResponseDto)
  async socketTicket(@Param('roomId') roomId: string): Promise<SupportSocketTicketResponseDto> {
    await this.internalClient.fetch(`/internal/support/rooms/${roomId}`);
    const ticket = crypto.randomUUID();
    await this.kvStore.set(`admin:support:socket-ticket:${ticket}`, { roomId }, 30);
    return Object.assign(new SupportSocketTicketResponseDto(), { ticket });
  }

  @ApiOperation({ summary: '고객지원 채팅 원문 조회' })
  @Get('rooms/:roomId/messages/pii') @Permissions(AdminPermission.support.piiRead) @SwaggerApiResponse(SupportMessageListResponseDto)
  listMessagePii(@Param('roomId') roomId: string): Promise<SupportMessageListResponseDto> {
    return this.internalClient.fetch(`/internal/support/rooms/${roomId}/messages`);
  }

  @Post('rooms/:roomId/messages') @Permissions(AdminPermission.support.update) @SwaggerApiResponse(SupportMessageItemDto)
  createMessage(@Param('roomId') roomId: string, @Body() input: CreateSupportMessageRequestDto) { return this.internalClient.fetch(`/internal/support/rooms/${roomId}/messages`, { method: 'POST', body: input }); }

  @Patch('rooms/:roomId') @Permissions(AdminPermission.support.update) @SwaggerApiResponse(SupportRoomItemDto)
  updateRoom(@Param('roomId') roomId: string, @Body() input: UpdateSupportRoomRequestDto) { return this.internalClient.fetch(`/internal/support/rooms/${roomId}`, { method: 'PATCH', body: input }); }

  private params(query: GetSupportRoomsRequestDto): string {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    for (const field of query.sort) params.append('sort[]', field);
    for (const direction of query.direction) params.append('direction[]', direction);
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    return params.toString();
  }
}

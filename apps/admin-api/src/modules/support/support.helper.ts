import { maskEmail, maskName, maskPhone } from '@pkg/shared/common';

import { GetSupportMessagesResponseDto } from '~/modules/support/message/get-support-messages.response.dto';
import { SupportMessageItemDto } from '~/modules/support/message/support-message-item.dto';
import { SupportRoomItemDto } from '~/modules/support/room/support-room-item.dto';

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

export function maskMessages(response: GetSupportMessagesResponseDto): GetSupportMessagesResponseDto {
  return GetSupportMessagesResponseDto.parse({
    ...response,
    items: response.items.map((message) => SupportMessageItemDto.parse({
      ...message,
      senderName: message.senderType === 'user' ? maskName(message.senderName) : message.senderName,
      content: maskMessageContent(message.content),
    })),
  });
}

export function maskRoom(room: SupportRoomItemDto): SupportRoomItemDto {
  return SupportRoomItemDto.parse({ ...room, title: maskMessageContent(room.title), userName: maskName(room.userName) });
}

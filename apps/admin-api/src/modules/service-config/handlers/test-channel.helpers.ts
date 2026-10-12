import { TestChannelResponseDto } from '#/modules/service-config/dto/test-channel.response.dto';

export const result = (): TestChannelResponseDto => TestChannelResponseDto.parse({ ok: true });

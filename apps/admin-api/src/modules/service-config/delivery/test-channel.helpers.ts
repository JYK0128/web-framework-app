import { TestChannelResponseDto } from '#/modules/service-config/delivery/test-channel.response.dto';

export const result = (): TestChannelResponseDto => TestChannelResponseDto.parse({ ok: true });

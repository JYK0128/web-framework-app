import { TestChannelResponseDto } from '#/modules/system-configs/dto/delivery/test-channel.response.dto';

export const result = (): TestChannelResponseDto => TestChannelResponseDto.fromPlain({ ok: true });

import type { CreateNoticeRequestDto } from '#/modules/notices/dto';

export class CreateNoticeCommand {
  constructor(public readonly input: CreateNoticeRequestDto) {}
}

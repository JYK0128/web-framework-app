import type { UpdateNoticeRequestDto } from '#/modules/notices/dto';

export class UpdateNoticeCommand {
  constructor(
    public readonly id: string,
    public readonly input: UpdateNoticeRequestDto,
  ) {}
}

import { PartialType } from '@nestjs/swagger';

import { CreateNoticeRequestDto } from '#/modules/notices/dto/create-notice.request.dto';

export class UpdateNoticeRequestDto extends PartialType(CreateNoticeRequestDto) {
  static readonly richTextFields = ['content'];
}

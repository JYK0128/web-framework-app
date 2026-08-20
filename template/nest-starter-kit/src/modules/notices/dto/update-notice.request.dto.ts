import { PartialType } from '@nestjs/swagger';

import { CreateNoticeRequestDto } from './create-notice.request.dto';

export class UpdateNoticeRequestDto extends PartialType(CreateNoticeRequestDto) {
}

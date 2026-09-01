import { ApiSchema } from '@nestjs/swagger';

import { NoticeItemDto } from './notice-item.dto';

@ApiSchema({ name: 'UpdateNoticeResponse' })
export class UpdateNoticeResponseDto extends NoticeItemDto {}

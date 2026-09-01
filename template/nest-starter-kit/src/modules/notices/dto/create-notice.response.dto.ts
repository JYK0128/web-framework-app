import { ApiSchema } from '@nestjs/swagger';

import { NoticeItemDto } from './notice-item.dto';

@ApiSchema({ name: 'CreateNoticeResponse' })
export class CreateNoticeResponseDto extends NoticeItemDto {}

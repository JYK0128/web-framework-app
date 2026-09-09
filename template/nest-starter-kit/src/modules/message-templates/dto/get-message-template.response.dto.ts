import { ApiSchema } from '@nestjs/swagger';

import { MessageTemplateItemDto } from './message-template-item.dto';

@ApiSchema({ name: 'GetMessageTemplateResponse' })
export class GetMessageTemplateResponseDto extends MessageTemplateItemDto {}

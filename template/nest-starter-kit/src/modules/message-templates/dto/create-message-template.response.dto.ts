import { ApiSchema } from '@nestjs/swagger';

import { MessageTemplateItemDto } from './message-template-item.dto';

@ApiSchema({ name: 'CreateMessageTemplateResponse' })
export class CreateMessageTemplateResponseDto extends MessageTemplateItemDto {}

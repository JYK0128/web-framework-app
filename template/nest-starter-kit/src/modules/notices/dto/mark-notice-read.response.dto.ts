import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'MarkNoticeReadResponse' })
export class MarkNoticeReadResponseDto extends OkResponseDto {}

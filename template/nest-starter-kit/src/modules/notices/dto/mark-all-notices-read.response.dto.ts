import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'MarkAllNoticesReadResponse' })
export class MarkAllNoticesReadResponseDto extends OkResponseDto {}

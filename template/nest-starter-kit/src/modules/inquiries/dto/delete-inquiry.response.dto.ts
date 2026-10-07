import { ApiSchema } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'DeleteInquiryResponse' })
export class DeleteInquiryResponseDto extends OkResponseDto {}

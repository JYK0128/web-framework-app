import { ApiSchema } from '@nestjs/swagger';

import { DeleteInquiryResponseDto } from './delete-inquiry.response.dto';

@ApiSchema({ name: 'DeleteAdminInquiryResponseDto' })
export class DeleteAdminInquiryResponseDto extends DeleteInquiryResponseDto {}

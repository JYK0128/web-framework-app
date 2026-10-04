import { ApiSchema } from '@nestjs/swagger';

import { CreateInquiryMessageRequestDto } from './create-inquiry-message.request.dto';

@ApiSchema({ name: 'CreateInquiryMessageRequestDto' })
export class CreateAdminInquiryMessageRequestDto extends CreateInquiryMessageRequestDto {}

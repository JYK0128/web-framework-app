import { ApiSchema } from '@nestjs/swagger';

import { UpdateInquiryRequestDto } from './update-inquiry.request.dto';

@ApiSchema({ name: 'UpdateInquiryRequestDto' })
export class UpdateAdminInquiryRequestDto extends UpdateInquiryRequestDto {}

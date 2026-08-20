import { PartialType } from '@nestjs/swagger';

import { CreateTermGroupRequestDto } from './create-term-group.request.dto';

export class UpdateTermGroupRequestDto extends PartialType(CreateTermGroupRequestDto) {
}

import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

@ApiSchema({ name: 'SupportSocketTicket' })
export class SupportSocketTicketResponseDto extends BaseDto {
  @ApiProperty() ticket!: string;
}

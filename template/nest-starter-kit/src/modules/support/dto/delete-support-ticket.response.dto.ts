import { ApiProperty } from '@nestjs/swagger';

export class DeleteSupportTicketResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}

import { ApiProperty } from '@nestjs/swagger';

export class DeleteNoticeResponseDto {
  @ApiProperty({ type: Boolean })
  ok!: boolean;
}

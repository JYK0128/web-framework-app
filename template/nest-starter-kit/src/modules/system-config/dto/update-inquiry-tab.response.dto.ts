import { ApiProperty } from '@nestjs/swagger';

export class UpdateInquiryTabResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}

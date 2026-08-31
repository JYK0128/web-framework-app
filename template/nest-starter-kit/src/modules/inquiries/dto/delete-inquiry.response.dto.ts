import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'DeleteInquiryResponse' })
export class DeleteInquiryResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}

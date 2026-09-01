import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UpdateMessagesTabResponse' })
export class UpdateMessagesTabResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}

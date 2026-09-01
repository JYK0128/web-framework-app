import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UnbanUserResponse' })
export class UnbanUserResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}

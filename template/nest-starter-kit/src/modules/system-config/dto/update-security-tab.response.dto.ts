import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UpdateSecurityTabResponse' })
export class UpdateSecurityTabResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}

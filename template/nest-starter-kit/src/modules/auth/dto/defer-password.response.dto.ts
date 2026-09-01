import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'DeferPasswordResponse' })
export class DeferPasswordResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}

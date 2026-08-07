import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'DeferPasswordResponse' })
export class DeferPasswordResponseDto {
  @ApiProperty()
  ok!: boolean;
}

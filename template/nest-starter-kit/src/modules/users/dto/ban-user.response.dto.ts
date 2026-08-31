import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'BanUserResponse' })
export class BanUserResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}

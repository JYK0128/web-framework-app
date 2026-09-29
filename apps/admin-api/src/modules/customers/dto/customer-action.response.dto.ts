import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'AdminCustomerActionResponse' })
export class CustomerActionResponseDto {
  @ApiProperty()
  success!: boolean;
}

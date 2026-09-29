import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'InternalCustomerActionResponse' })
export class CustomerActionResponseDto {
  @ApiProperty()
  success!: boolean;

  static fromPlain(input: Partial<CustomerActionResponseDto>): CustomerActionResponseDto {
    return Object.assign(new CustomerActionResponseDto(), input);
  }
}

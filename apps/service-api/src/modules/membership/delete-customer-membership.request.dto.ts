import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteCustomerMembershipRequestDto extends BaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  membershipId!: string;
}

import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

@ApiSchema({ name: 'EmailVerificationRequestResponseDto' })
export class RequestEmailVerificationResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean, description: '계정 존재 여부와 무관하게 요청을 접수했다는 표시' })
  accepted!: boolean;
}

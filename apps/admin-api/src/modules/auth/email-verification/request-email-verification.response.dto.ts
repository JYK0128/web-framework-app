import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

@ApiSchema({ name: 'EmailVerificationRequestResponseDto' })
export class RequestEmailVerificationResponseDto extends BaseDto { @ApiProperty() accepted!: boolean; }

import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';

export class CreateOAuthIconPresignedUrlResponseDto extends BaseDto {
  @ApiProperty() uploadUrl!: string;
  @ApiProperty() fileUrl!: string;
  @ApiProperty() uploadId!: string;
  @ApiProperty() expiresInSeconds!: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

export class OkResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean, example: true })
  ok!: boolean;
}

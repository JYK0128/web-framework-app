import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

export class DeleteEventResponseDto extends BaseDto {
  @ApiProperty()
  ok!: boolean;
}

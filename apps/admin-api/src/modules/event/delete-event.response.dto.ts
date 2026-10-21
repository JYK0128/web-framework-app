import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';

export class DeleteEventResponseDto extends BaseDto {
  @ApiProperty()
  ok!: boolean;
}

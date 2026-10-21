import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';

export class DeleteNoticeResponseDto extends BaseDto {
  @ApiProperty()
  ok!: boolean;
}

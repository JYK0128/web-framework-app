import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

export class DeleteNoticeResponseDto extends BaseDto {
  @ApiProperty()
  ok!: boolean;
}

import { ApiProperty } from '@nestjs/swagger';

import { OkResponseDto } from '#/core/http/dto/response/ok.response.dto';

export class UpdateServiceConfigResponseDto extends OkResponseDto {
  @ApiProperty({ type: String, isArray: true })
  updatedKeys!: string[];
}

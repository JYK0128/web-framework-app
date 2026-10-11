import { ApiProperty } from '@nestjs/swagger';
import { ServiceSystemConfigCode } from '@pkg/shared/constants';

import { OkResponseDto } from '#/core/http/dto/response/ok.response.dto';

export class UpdateSystemConfigResponseDto extends OkResponseDto {
  @ApiProperty({ enum: ServiceSystemConfigCode, isArray: true })
  updatedKeys!: ServiceSystemConfigCode[];
}

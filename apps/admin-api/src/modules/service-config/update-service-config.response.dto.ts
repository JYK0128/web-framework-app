import { ApiProperty } from '@nestjs/swagger';
import { OkResponseDto } from '@pkg/server-core/http/dto/response/ok.response.dto';

export class UpdateServiceConfigResponseDto extends OkResponseDto {
  @ApiProperty({ type: String, isArray: true })
  updatedKeys!: string[];
}

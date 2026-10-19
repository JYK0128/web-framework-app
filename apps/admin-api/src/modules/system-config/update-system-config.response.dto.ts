import { ApiProperty } from '@nestjs/swagger';
import { OkResponseDto } from '@pkg/server-core/http/dto/response/ok.response.dto';

export class UpdateSystemConfigResponseDto extends OkResponseDto {
  @ApiProperty({ type: String, isArray: true })
  updatedKeys!: string[];

  @ApiProperty({ type: String, isArray: true, description: '서비스 API에 동기화가 확인된 관리자 설정' })
  syncedKeys!: string[];

  @ApiProperty({ type: String, isArray: true, description: '서비스 API 반영 결과를 확인하지 못한 설정. 실패 응답의 details에도 같은 구조를 사용합니다.' })
  unconfirmedKeys!: string[];
}

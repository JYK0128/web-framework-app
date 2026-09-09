import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces/response';

@ApiSchema({ name: 'FindIdItem' })
export class FindIdItemDto {
  @ApiProperty({ type: 'string', description: '마스킹된 이메일' })
  maskedEmail!: string;

  @ApiProperty({ type: 'string', description: '가입 로그인 수단 (credential, google, kakao, naver, github 등)' })
  provider!: string;

  @ApiProperty({ type: 'string', format: 'date-time', description: '가입 일시' })
  createdAt!: Date;
}

@ApiSchema({ name: 'FindIdResponse' })
export class FindIdResponseDto extends ListResponseDto<FindIdItemDto> {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: () => [FindIdItemDto] })
  override items!: FindIdItemDto[];
}

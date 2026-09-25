import { ApiProperty } from '@nestjs/swagger';

export class OperationNoticeResponseDto {
  @ApiProperty({ description: '현재 고객센터 운영 중인지 여부', example: false })
  isOperating!: boolean;

  @ApiProperty({ type: String, description: '운영시간 외 상태 안내. 운영 중이면 null', example: '현재는 운영시간 외입니다.', nullable: true })
  message!: string | null;
}

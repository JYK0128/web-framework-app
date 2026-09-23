import { ApiProperty } from '@nestjs/swagger';

export class FaqActionResponseDto {
  @ApiProperty() success!: boolean;
}

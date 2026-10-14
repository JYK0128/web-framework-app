import { ApiProperty } from '@nestjs/swagger';

export class DeleteEventResponseDto {
  @ApiProperty({ type: Boolean })
  ok!: boolean;
}

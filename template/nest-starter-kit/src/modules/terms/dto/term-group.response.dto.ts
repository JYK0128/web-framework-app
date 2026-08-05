import { ApiProperty } from '@nestjs/swagger';

export class TermResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() version!: string;
  @ApiProperty() content!: string;
  @ApiProperty() publishedAt?: string | null;
}

export class TermGroupResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty({ type: TermResponseDto })
  term!: TermResponseDto;
}

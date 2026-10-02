import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

const compactPhoneNumber = ({ value }: { value: unknown }) => typeof value === 'string' ? value.replace(/[^0-9+]/g, '') : value;

export class FindIdRequestDto {
  @ApiProperty({ example: 'Sample User' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '01012345678' })
  @Transform(compactPhoneNumber)
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;
}

export class FindIdItemDto {
  @ApiProperty({ type: String })
  maskedEmail!: string;

  @ApiProperty({ type: String })
  provider!: string;
}

export class FindIdResponseDto {
  @ApiProperty({ type: [FindIdItemDto] })
  items!: FindIdItemDto[];
}

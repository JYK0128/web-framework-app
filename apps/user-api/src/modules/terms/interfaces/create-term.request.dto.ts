import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTermRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  termGroupId!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;
}

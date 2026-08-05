import { ApiProperty } from '@nestjs/swagger';

export class MyAgreementResponseDto {
  @ApiProperty()
  termGroupId!: string;

  @ApiProperty()
  termGroupCode!: string;

  @ApiProperty()
  termGroupName!: string;

  @ApiProperty()
  isRequired!: boolean;

  @ApiProperty()
  termId!: string;

  @ApiProperty()
  termVersion!: string;

  @ApiProperty()
  agreedAt!: Date;
}

import { ApiProperty } from '@nestjs/swagger';

export class UserItemDto {
  @ApiProperty({ example: 'usr_12345' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: '홍길동' })
  name!: string;

  @ApiProperty({ example: 'user' })
  role!: string;

  @ApiProperty({ example: false })
  twoFactorEnabled!: boolean;

  @ApiProperty({ example: '2026-08-12T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-12T00:00:00.000Z' })
  updatedAt!: string;
}

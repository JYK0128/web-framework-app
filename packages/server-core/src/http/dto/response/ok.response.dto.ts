import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { type ClassConstructor } from 'class-transformer';

type OkResponseDtoConstructor<T extends OkResponseDto> = ClassConstructor<T> & { parse(plain: unknown): T };

export class OkResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean, example: true })
  ok!: boolean;

  static ok<T extends OkResponseDto>(this: OkResponseDtoConstructor<T>): T {
    return this.parse({ ok: true });
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { type ClassConstructor, Transform } from 'class-transformer';

import { EntityDto } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';

type TermPlain = Term & { code?: string, title?: string, isRequired?: boolean, sortOrder?: number };

export class TermItemDto extends EntityDto(Term, TermGroup) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override version!: string;

  @ApiProperty({ type: 'string' })
  override content!: string;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override publishedAt!: Date | null;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: TermPlain }) => obj.termGroup?.code ?? obj.code)
  override code!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: TermPlain }) => obj.termGroup?.title ?? obj.title)
  override title!: string;

  @ApiProperty({ type: 'boolean' })
  @Transform(({ obj }: { obj: TermPlain }) => obj.termGroup?.isRequired ?? obj.isRequired)
  override isRequired!: boolean;

  @ApiProperty({ type: 'number' })
  @Transform(({ obj }: { obj: TermPlain }) => obj.termGroup?.sortOrder ?? obj.sortOrder)
  override sortOrder!: number;

  static from<T extends TermItemDto>(this: ClassConstructor<T>, term: Term): T {
    return (this as unknown as typeof TermItemDto).fromPlain<T>(term);
  }
}

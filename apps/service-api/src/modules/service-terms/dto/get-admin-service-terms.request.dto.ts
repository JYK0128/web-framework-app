import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { Term } from '#/entities/terms/term.entity';

export class GetAdminServiceTermsRequestDto extends PageRequestDto<Term> {
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  override get searchFields(): (keyof Term)[] { return ['version', 'content']; }
}

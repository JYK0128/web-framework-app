import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'SetServiceTermAgreementsResponse' })
export class SetServiceTermAgreementsResponseDto {
  @ApiProperty() success!: boolean;
}

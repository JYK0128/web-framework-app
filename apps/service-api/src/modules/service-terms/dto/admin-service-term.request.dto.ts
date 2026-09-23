import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

@ApiSchema({ name: 'AdminServiceTermRequest' })
export class AdminServiceTermRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() title!: string;
  @ApiProperty() @IsString() @IsNotEmpty() version!: string;
  @ApiProperty() @IsString() @IsNotEmpty() content!: string;
  @ApiProperty({ type: Boolean }) @IsBoolean() isRequired = true;
  @ApiProperty({ type: Number, minimum: 0, maximum: 999999 }) @IsInt() @Min(0) @Max(999999) sortOrder = 0;
}

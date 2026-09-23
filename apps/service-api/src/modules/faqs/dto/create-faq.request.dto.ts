import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

@ApiSchema({ name: 'CreateFaqRequest' })
export class CreateFaqRequestDto {
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() category!: string;
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() question!: string;
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() answer!: string;
  @ApiProperty({ type: Number, minimum: 0, maximum: 999999 }) @IsInt() @Min(0) @Max(999999) sortOrder = 0;
  @ApiProperty({ type: Boolean, default: true }) @IsBoolean() isPublished = true;
}

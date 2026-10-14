import { PickType } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request/page.request.dto';

export class GetTermRevisionsRequestDto extends PickType(PageRequestDto, ['page', 'limit'] as const) {}

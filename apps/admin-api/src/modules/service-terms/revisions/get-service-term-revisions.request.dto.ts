import { PickType } from '@nestjs/swagger';

import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';

export class GetServiceTermRevisionsRequestDto extends PickType(PageRequestDto, ['page', 'limit'] as const) {}

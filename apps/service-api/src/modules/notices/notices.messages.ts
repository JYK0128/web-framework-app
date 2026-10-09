import type { CreateNoticeRequestDto, GetNoticesRequestDto, UpdateNoticeRequestDto } from './notices.dto';

export class GetNoticesQuery { constructor(readonly input: GetNoticesRequestDto, readonly publicOnly = false) {} }
export class GetNoticeQuery { constructor(readonly id: string, readonly publicOnly = false) {} }
export class CreateNoticeCommand { constructor(readonly input: CreateNoticeRequestDto) {} }
export class UpdateNoticeCommand { constructor(readonly id: string, readonly input: UpdateNoticeRequestDto) {} }
export class DeleteNoticeCommand { constructor(readonly id: string) {} }

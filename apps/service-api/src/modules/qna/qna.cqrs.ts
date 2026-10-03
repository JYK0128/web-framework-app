import { Command, Query } from '@nestjs/cqrs';

import type { CreateQnaRequestDto, GetQnaRequestDto, QnaActionResponseDto, QnaItemDto, QnaPageResponseDto, UpdateOwnQnaRequestDto, UpdateQnaRequestDto } from './dto/qna.dto';

export class GetOwnQnasQuery extends Query<QnaPageResponseDto> { constructor(public readonly input: GetQnaRequestDto) { super(); } }
export class GetAllQnasQuery extends Query<QnaPageResponseDto> { constructor(public readonly input: GetQnaRequestDto) { super(); } }
export class GetOwnQnaQuery extends Query<QnaItemDto> { constructor(public readonly input: { qnaId: string }) { super(); } }
export class GetAllQnaQuery extends Query<QnaItemDto> { constructor(public readonly input: { qnaId: string }) { super(); } }
export class CreateOwnQnaCommand extends Command<QnaItemDto> { constructor(public readonly input: CreateQnaRequestDto) { super(); } }
export class UpdateOwnQnaCommand extends Command<QnaItemDto> { constructor(public readonly input: { qnaId: string, dto: UpdateOwnQnaRequestDto }) { super(); } }
export class UpdateQnaCommand extends Command<QnaItemDto> { constructor(public readonly input: { qnaId: string, dto: UpdateQnaRequestDto }) { super(); } }
export class DeleteOwnQnaCommand extends Command<QnaActionResponseDto> { constructor(public readonly input: { qnaId: string }) { super(); } }
export class DeleteQnaCommand extends Command<QnaActionResponseDto> { constructor(public readonly input: { qnaId: string }) { super(); } }

import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler, type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { QnaActionResponseDto, QnaItemDto, QnaListResponseDto } from './dto/qna.dto';
import { QnaService } from './qna.service';
import { CreateOwnQnaCommand, DeleteOwnQnaCommand, DeleteQnaCommand, GetAllQnaQuery, GetAllQnasQuery, GetOwnQnaQuery, GetOwnQnasQuery, UpdateOwnQnaCommand, UpdateQnaCommand } from './qna.cqrs';

@Injectable() @QueryHandler(GetOwnQnasQuery)
export class GetOwnQnasHandler implements IQueryHandler<GetOwnQnasQuery, QnaListResponseDto> { constructor(private readonly service: QnaService) {} execute({ input }: GetOwnQnasQuery) { return this.service.list(input); } }
@Injectable() @QueryHandler(GetAllQnasQuery)
export class GetAllQnasHandler implements IQueryHandler<GetAllQnasQuery, QnaListResponseDto> { constructor(private readonly service: QnaService) {} execute({ input }: GetAllQnasQuery) { return this.service.list(input, false); } }
@Injectable() @QueryHandler(GetOwnQnaQuery)
export class GetOwnQnaHandler implements IQueryHandler<GetOwnQnaQuery, QnaItemDto> { constructor(private readonly service: QnaService) {} execute({ input }: GetOwnQnaQuery) { return this.service.get(input.qnaId); } }
@Injectable() @QueryHandler(GetAllQnaQuery)
export class GetAllQnaHandler implements IQueryHandler<GetAllQnaQuery, QnaItemDto> { constructor(private readonly service: QnaService) {} execute({ input }: GetAllQnaQuery) { return this.service.get(input.qnaId, false); } }
@Injectable() @CommandHandler(CreateOwnQnaCommand)
export class CreateOwnQnaHandler implements ICommandHandler<CreateOwnQnaCommand, QnaItemDto> { constructor(private readonly service: QnaService) {} execute({ input }: CreateOwnQnaCommand) { return this.service.create(input); } }
@Injectable() @CommandHandler(UpdateOwnQnaCommand)
export class UpdateOwnQnaHandler implements ICommandHandler<UpdateOwnQnaCommand, QnaItemDto> { constructor(private readonly service: QnaService) {} execute({ input }: UpdateOwnQnaCommand) { return this.service.update(input.qnaId, input.dto, true); } }
@Injectable() @CommandHandler(UpdateQnaCommand)
export class UpdateQnaHandler implements ICommandHandler<UpdateQnaCommand, QnaItemDto> { constructor(private readonly service: QnaService) {} execute({ input }: UpdateQnaCommand) { return this.service.update(input.qnaId, input.dto, false); } }
@Injectable() @CommandHandler(DeleteOwnQnaCommand)
export class DeleteOwnQnaHandler implements ICommandHandler<DeleteOwnQnaCommand, QnaActionResponseDto> { constructor(private readonly service: QnaService) {} async execute({ input }: DeleteOwnQnaCommand) { return QnaActionResponseDto.fromPlain(await this.service.remove(input.qnaId, true)); } }
@Injectable() @CommandHandler(DeleteQnaCommand)
export class DeleteQnaHandler implements ICommandHandler<DeleteQnaCommand, QnaActionResponseDto> { constructor(private readonly service: QnaService) {} async execute({ input }: DeleteQnaCommand) { return QnaActionResponseDto.fromPlain(await this.service.remove(input.qnaId, false)); } }

import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetInquiryResponseDto } from '#/modules/inquiries/dto';
import { GetInquiryQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetInquiryQuery)
export class GetInquiryHandler implements IQueryHandler<GetInquiryQuery, GetInquiryResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(query: GetInquiryQuery): Promise<GetInquiryResponseDto> {
    const inquiry = await this.identifyInquiry(query.input.id, this.sessionContext.requiredUser.id);
    this.verify(inquiry);
    return this.process(inquiry);
  }

  private verify(inquiry: Inquiry): void {
    if (!inquiry) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
  }

  private async identifyInquiry(id: string, userId: string): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      { id, user: userId },
      { populate: ['user', 'assignee'] },
    );
    if (!inquiry) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }

  private process(inquiry: Inquiry): GetInquiryResponseDto {
    return GetInquiryResponseDto.fromPlain({
      id: inquiry.id,
      category: inquiry.category,
      title: inquiry.title,
      content: inquiry.content,
      status: inquiry.status,
      createdAt: inquiry.createdAt,
      updatedAt: inquiry.updatedAt,
      userId: inquiry.user.id,
      userName: inquiry.user.name,
      assigneeId: inquiry.assignee?.id ?? null,
      assigneeName: inquiry.assignee?.name ?? inquiry.assignee?.email ?? null,
    });
  }
}

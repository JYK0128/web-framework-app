import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetInquiryResponseDto } from '#/modules/inquiries/dto';
import { GetInquiryQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetInquiryQuery)
export class GetInquiryHandler implements IQueryHandler<GetInquiryQuery, GetInquiryResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetInquiryQuery): Promise<GetInquiryResponseDto> {
    const inquiry = await this.identifyInquiry(query.input.id, query.input.userId);
    return this.process(inquiry);
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
    return new GetInquiryResponseDto(inquiry);
  }
}

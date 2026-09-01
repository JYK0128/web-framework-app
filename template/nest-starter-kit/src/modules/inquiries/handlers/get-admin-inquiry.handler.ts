import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetAdminInquiryResponseDto } from '#/modules/inquiries/dto';
import { GetAdminInquiryQuery } from '#/modules/inquiries/queries';

@Injectable()
@QueryHandler(GetAdminInquiryQuery)
export class GetAdminInquiryHandler implements IQueryHandler<GetAdminInquiryQuery, GetAdminInquiryResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminInquiryQuery): Promise<GetAdminInquiryResponseDto> {
    const inquiry = await this.identifyInquiry(query.input.id);
    return this.process(inquiry);
  }

  private async identifyInquiry(id: string): Promise<Inquiry> {
    const inquiry = await this.em.findOne(
      Inquiry,
      { id },
      { filters: false, populate: ['user', 'assignee'] },
    );
    if (!inquiry || inquiry.deletedAt) {
      throw new ApplicationError({ code: 'INQUIRY_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return inquiry;
  }

  private process(inquiry: Inquiry): GetAdminInquiryResponseDto {
    return new GetAdminInquiryResponseDto(inquiry);
  }
}

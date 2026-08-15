import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';

import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { AppEntityManager } from '#/database/entity-manager';
import { Faq } from '#/entities/faqs/faq.entity';

import { CreateFaqRequestDto, FaqItemDto, GetAdminFaqsRequestDto, GetAdminFaqsResponseDto, GetFaqsRequestDto, GetFaqsResponseDto, UpdateFaqRequestDto } from './dto';

@ApiTags('faqs')
@Controller('faqs')
export class FaqsController {
  constructor(
    @Inject(AppEntityManager)
    private readonly em: AppEntityManager,
  ) {}

  @Public()
  @Get()
  @SwaggerApiResponse(GetFaqsResponseDto)
  async getFaqs(@Query() query: GetFaqsRequestDto): Promise<GetFaqsResponseDto> {
    const where: Record<string, unknown> = { isPublished: true };

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      const search = query.search.trim();
      where.$or = [
        { question: { $like: `%${search}%` } },
        { answer: { $like: `%${search}%` } },
      ];
    }

    const faqs = await this.em.find(Faq, where, {
      orderBy: { order: 'ASC', createdAt: 'DESC' },
    });

    const allPublishedFaqs = await this.em.find(Faq, { isPublished: true }, {
      fields: ['category'],
      orderBy: { category: 'ASC' },
    });
    const categories = Array.from(new Set(allPublishedFaqs.map((f) => f.category)));

    return {
      items: faqs.map((faq) => new FaqItemDto(faq)),
      categories,
    };
  }

  @Public()
  @Post(':id/helpful')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(FaqItemDto)
  async markHelpful(@Param('id') id: string): Promise<FaqItemDto> {
    const faq = await this.em.findOne(Faq, { id });
    if (!faq) {
      throw new ApplicationError({ code: 'FAQ_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    faq.helpfulCount += 1;
    await this.em.flush();

    return new FaqItemDto(faq);
  }

  @Permission('faq:read')
  @Get('admin')
  @SwaggerApiResponse(GetAdminFaqsResponseDto)
  async getAdminFaqs(@Query() query: GetAdminFaqsRequestDto): Promise<GetAdminFaqsResponseDto> {
    const pageResult = await this.em.findByPage(Faq, query.toFilterQuery(), query.toPageOptions());

    return {
      ...pageResult,
      items: pageResult.items.map((faq) => new FaqItemDto(faq)),
    };
  }

  @Permission('faq:create')
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(FaqItemDto)
  async createFaq(@Body() dto: CreateFaqRequestDto): Promise<FaqItemDto> {
    const faq = this.em.create(Faq, {
      category: dto.category.trim(),
      question: dto.question.trim(),
      answer: dto.answer.trim(),
      order: dto.order ?? 0,
      isPublished: dto.isPublished ?? true,
    });

    await this.em.persist(faq).flush();
    return new FaqItemDto(faq);
  }

  @Permission('faq:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(FaqItemDto)
  async updateFaq(
    @Param('id') id: string,
    @Body() dto: UpdateFaqRequestDto,
  ): Promise<FaqItemDto> {
    const faq = await this.em.findOne(Faq, { id });
    if (!faq) {
      throw new ApplicationError({ code: 'FAQ_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    if (dto.category !== undefined) faq.category = dto.category.trim();
    if (dto.question !== undefined) faq.question = dto.question.trim();
    if (dto.answer !== undefined) faq.answer = dto.answer.trim();
    if (dto.order !== undefined) faq.order = dto.order;
    if (dto.isPublished !== undefined) faq.isPublished = dto.isPublished;

    await this.em.flush();
    return new FaqItemDto(faq);
  }

  @Permission('faq:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFaq(@Param('id') id: string): Promise<void> {
    const faq = await this.em.findOne(Faq, { id });
    if (!faq) {
      throw new ApplicationError({ code: 'FAQ_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    await this.em.remove(faq).flush();
  }
}

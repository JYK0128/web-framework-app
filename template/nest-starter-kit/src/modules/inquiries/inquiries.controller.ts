import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import type { AuthPrincipal } from '#/common/security/auth-token.types';
import { InquiryStatus } from '#/entities/inquiries/inquiry.entity';

import { CreateInquiryCommand, CreateInquiryMessageCommand, DeleteInquiryCommand, UpdateInquiryCommand } from './commands';
import { CreateInquiryMessageRequestDto, CreateInquiryRequestDto, GetAdminInquiriesRequestDto, GetInquiriesRequestDto, GetInquiriesResponseDto, GetInquiryMessagesResponseDto, InquiryItemDto, InquiryMessageItemDto, UpdateInquiryRequestDto } from './dto';
import { InquiryCreatedEvent } from './events';
import { InquiryMessagesGateway } from './inquiry-messages.gateway';
import { GetAdminInquiriesQuery, GetAdminInquiryQuery, GetInquiriesQuery, GetInquiryMessagesQuery, GetInquiryQuery } from './queries';

@ApiTags('inquiries')
@Controller('inquiries')
export class InquiriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly inquiryMessagesGateway: InquiryMessagesGateway,
  ) {}

  @Permission('inquiry:manage', 'inquiry:read')
  @Get('admin')
  @SwaggerApiResponse(GetInquiriesResponseDto)
  async getAdminInquiries(@Query() query: GetAdminInquiriesRequestDto): Promise<GetInquiriesResponseDto> {
    return this.queryBus.execute(new GetAdminInquiriesQuery(query));
  }

  @Permission('inquiry:manage', 'inquiry:read')
  @Get('admin/:id')
  @SwaggerApiResponse(InquiryItemDto)
  async getAdminInquiry(@Param('id') id: string): Promise<InquiryItemDto> {
    return this.queryBus.execute(new GetAdminInquiryQuery(id));
  }

  @Permission('inquiry:manage', 'inquiry:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(InquiryItemDto)
  async updateAdminInquiry(
    @Param('id') id: string,
    @Body() input: UpdateInquiryRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<InquiryItemDto> {
    const result = await this.commandBus.execute<UpdateInquiryCommand, InquiryItemDto>(new UpdateInquiryCommand(id, input, currentUser.id, true));
    if (input.status !== undefined) {
      await this.inquiryMessagesGateway.broadcastStatusChange(id, result.status);
    }
    return result;
  }

  @Permission('inquiry:manage', 'inquiry:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAdminInquiry(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteInquiryCommand(id, currentUser.id, true));
  }

  @Permission('inquiry:manage', 'inquiry:read')
  @Get('admin/:id/messages')
  @SwaggerApiResponse(GetInquiryMessagesResponseDto)
  async getAdminInquiryMessages(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<GetInquiryMessagesResponseDto> {
    return this.queryBus.execute(new GetInquiryMessagesQuery(id, currentUser.id, true));
  }

  @Permission('inquiry:manage', 'inquiry:create')
  @Post('admin/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(InquiryMessageItemDto)
  async createAdminInquiryMessage(
    @Param('id') id: string,
    @Body() input: CreateInquiryMessageRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<InquiryMessageItemDto> {
    const result = await this.commandBus.execute<CreateInquiryMessageCommand, InquiryMessageItemDto>(new CreateInquiryMessageCommand(id, input, currentUser.id, true));
    await this.inquiryMessagesGateway.broadcastMessage(id, result);
    await this.inquiryMessagesGateway.broadcastStatusChange(id, InquiryStatus.ANSWERED);
    return result;
  }

  @Permission('inquiry:read')
  @Get()
  @SwaggerApiResponse(GetInquiriesResponseDto)
  async getInquiries(
    @Query() query: GetInquiriesRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<GetInquiriesResponseDto> {
    return this.queryBus.execute(new GetInquiriesQuery(query, currentUser.id));
  }

  @Permission('inquiry:create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(InquiryItemDto)
  async createInquiry(
    @Body() input: CreateInquiryRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<InquiryItemDto> {
    const result = await this.commandBus.execute(new CreateInquiryCommand(input, currentUser.id));
    this.eventBus.publish(new InquiryCreatedEvent(result, currentUser));
    return result;
  }

  @Permission('inquiry:read')
  @Get(':id')
  @SwaggerApiResponse(InquiryItemDto)
  async getInquiry(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<InquiryItemDto> {
    return this.queryBus.execute(new GetInquiryQuery(id, currentUser.id));
  }

  @Permission('inquiry:update')
  @Patch(':id')
  @SwaggerApiResponse(InquiryItemDto)
  async updateInquiry(
    @Param('id') id: string,
    @Body() input: UpdateInquiryRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<InquiryItemDto> {
    const result = await this.commandBus.execute<UpdateInquiryCommand, InquiryItemDto>(new UpdateInquiryCommand(id, input, currentUser.id, false));
    if (input.status !== undefined) {
      await this.inquiryMessagesGateway.broadcastStatusChange(id, result.status);
    }
    return result;
  }

  @Permission('inquiry:update')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInquiry(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteInquiryCommand(id, currentUser.id, false));
  }

  @Permission('inquiry:read')
  @Get(':id/messages')
  @SwaggerApiResponse(GetInquiryMessagesResponseDto)
  async getInquiryMessages(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<GetInquiryMessagesResponseDto> {
    return this.queryBus.execute(new GetInquiryMessagesQuery(id, currentUser.id, false));
  }

  @Permission('inquiry:create')
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(InquiryMessageItemDto)
  async createInquiryMessage(
    @Param('id') id: string,
    @Body() input: CreateInquiryMessageRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<InquiryMessageItemDto> {
    const result = await this.commandBus.execute<CreateInquiryMessageCommand, InquiryMessageItemDto>(new CreateInquiryMessageCommand(id, input, currentUser.id, false));
    await this.inquiryMessagesGateway.broadcastMessage(id, result);
    return result;
  }
}

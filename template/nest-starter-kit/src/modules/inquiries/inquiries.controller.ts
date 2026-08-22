import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { EventPublisher } from '#/infra/event-publisher';

import { CreateInquiryCommand, CreateInquiryMessageCommand, DeleteInquiryCommand, UpdateInquiryCommand } from './commands';
import { CreateAdminInquiryMessageResponseDto, CreateInquiryMessageRequestDto, CreateInquiryMessageResponseDto, CreateInquiryRequestDto, CreateInquiryResponseDto, DeleteInquiryResponseDto, GetAdminInquiriesRequestDto, GetAdminInquiriesResponseDto, GetAdminInquiryResponseDto, GetInquiriesRequestDto, GetInquiriesResponseDto, GetInquiryMessagesResponseDto, GetInquiryResponseDto, UpdateAdminInquiryResponseDto, UpdateInquiryRequestDto, UpdateInquiryResponseDto } from './dto';
import { InquiryCreatedEvent } from './events';
import { InquiryMessagesGateway } from './inquiry-messages.gateway';
import { GetAdminInquiriesQuery, GetAdminInquiryQuery, GetInquiriesQuery, GetInquiryMessagesQuery, GetInquiryQuery } from './queries';

@ApiTags('inquiries')
@Controller('inquiries')
export class InquiriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventPublisher: EventPublisher,
    private readonly inquiryMessagesGateway: InquiryMessagesGateway,
  ) {}

  @Permission('inquiry:manage', 'inquiry:read')
  @Get('admin')
  @SwaggerApiResponse(GetAdminInquiriesResponseDto)
  async getAdminInquiries(@Query() query: GetAdminInquiriesRequestDto): Promise<GetAdminInquiriesResponseDto> {
    return this.queryBus.execute(new GetAdminInquiriesQuery(query));
  }

  @Permission('inquiry:manage', 'inquiry:read')
  @Get('admin/:id')
  @SwaggerApiResponse(GetAdminInquiryResponseDto)
  async getAdminInquiry(@Param('id') id: string): Promise<GetAdminInquiryResponseDto> {
    return this.queryBus.execute(new GetAdminInquiryQuery({ id }));
  }

  @Permission('inquiry:manage', 'inquiry:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(UpdateAdminInquiryResponseDto)
  async updateAdminInquiry(
    @Param('id') id: string,
    @Body() input: UpdateInquiryRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<UpdateAdminInquiryResponseDto> {
    const result = await this.commandBus.execute(new UpdateInquiryCommand({
      inquiryId: id,
      input,
      userId: currentUser.id,
      isAdmin: true,
    }));
    if (input.status !== undefined) {
      await this.inquiryMessagesGateway.broadcastStatusChange(id, result.status);
    }
    return result;
  }

  @Permission('inquiry:manage', 'inquiry:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteInquiryResponseDto)
  async deleteAdminInquiry(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<DeleteInquiryResponseDto> {
    return this.commandBus.execute(new DeleteInquiryCommand({
      inquiryId: id,
      userId: currentUser.id,
      isAdmin: true,
    }));
  }

  @Permission('inquiry:manage', 'inquiry:read')
  @Get('admin/:id/messages')
  @SwaggerApiResponse(GetInquiryMessagesResponseDto)
  async getAdminInquiryMessages(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<GetInquiryMessagesResponseDto> {
    return this.queryBus.execute(new GetInquiryMessagesQuery({
      inquiryId: id,
      userId: currentUser.id,
      isAdmin: true,
    }));
  }

  @Permission('inquiry:manage', 'inquiry:create')
  @Post('admin/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateAdminInquiryMessageResponseDto, HttpStatus.CREATED)
  async createAdminInquiryMessage(
    @Param('id') id: string,
    @Body() input: CreateInquiryMessageRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<CreateAdminInquiryMessageResponseDto> {
    const result = await this.commandBus.execute(new CreateInquiryMessageCommand({
      inquiryId: id,
      input,
      authorId: currentUser.id,
      isAdmin: true,
    }));
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
  @SwaggerApiResponse(CreateInquiryResponseDto, HttpStatus.CREATED)
  async createInquiry(
    @Body() input: CreateInquiryRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<CreateInquiryResponseDto> {
    const result = await this.commandBus.execute(new CreateInquiryCommand({ input, userId: currentUser.id }));
    await this.eventPublisher.publish(new InquiryCreatedEvent(result, currentUser));
    return result;
  }

  @Permission('inquiry:read')
  @Get(':id')
  @SwaggerApiResponse(GetInquiryResponseDto)
  async getInquiry(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<GetInquiryResponseDto> {
    return this.queryBus.execute(new GetInquiryQuery({ id, userId: currentUser.id }));
  }

  @Permission('inquiry:update')
  @Patch(':id')
  @SwaggerApiResponse(UpdateInquiryResponseDto)
  async updateInquiry(
    @Param('id') id: string,
    @Body() input: UpdateInquiryRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<UpdateInquiryResponseDto> {
    const result = await this.commandBus.execute(new UpdateInquiryCommand({
      inquiryId: id,
      input,
      userId: currentUser.id,
      isAdmin: false,
    }));
    if (input.status !== undefined) {
      await this.inquiryMessagesGateway.broadcastStatusChange(id, result.status);
    }
    return result;
  }

  @Permission('inquiry:update')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteInquiryResponseDto)
  async deleteInquiry(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<DeleteInquiryResponseDto> {
    return this.commandBus.execute(new DeleteInquiryCommand({
      inquiryId: id,
      userId: currentUser.id,
      isAdmin: false,
    }));
  }

  @Permission('inquiry:read')
  @Get(':id/messages')
  @SwaggerApiResponse(GetInquiryMessagesResponseDto)
  async getInquiryMessages(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<GetInquiryMessagesResponseDto> {
    return this.queryBus.execute(new GetInquiryMessagesQuery({
      inquiryId: id,
      userId: currentUser.id,
      isAdmin: false,
    }));
  }

  @Permission('inquiry:create')
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateInquiryMessageResponseDto, HttpStatus.CREATED)
  async createInquiryMessage(
    @Param('id') id: string,
    @Body() input: CreateInquiryMessageRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<CreateInquiryMessageResponseDto> {
    const result = await this.commandBus.execute(new CreateInquiryMessageCommand({
      inquiryId: id,
      input,
      authorId: currentUser.id,
      isAdmin: false,
    }));
    await this.inquiryMessagesGateway.broadcastMessage(id, result);
    return result;
  }
}

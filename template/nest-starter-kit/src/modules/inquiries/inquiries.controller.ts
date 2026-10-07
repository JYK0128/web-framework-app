import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { SessionContext } from '#/common/contexts/session.context';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { InquiryStatus } from '#/entities/inquiries/inquiry.entity';
import { EventBroker } from '#/infra/event-broker';

import { CreateAdminInquiryMessageCommand, CreateInquiryCommand, CreateInquiryMessageCommand, DeleteAdminInquiryCommand, DeleteInquiryCommand, UpdateAdminInquiryCommand, UpdateInquiryCommand } from './commands';
import { CreateAdminInquiryMessageRequestDto, CreateAdminInquiryMessageResponseDto, CreateInquiryMessageRequestDto, CreateInquiryMessageResponseDto, CreateInquiryRequestDto, CreateInquiryResponseDto, DeleteAdminInquiryResponseDto, DeleteInquiryResponseDto, GetAdminInquiriesRequestDto, GetAdminInquiriesResponseDto, GetAdminInquiryMessagesResponseDto, GetAdminInquiryResponseDto, GetInquiriesRequestDto, GetInquiriesResponseDto, GetInquiryMessagesResponseDto, GetInquiryResponseDto, UpdateAdminInquiryRequestDto, UpdateAdminInquiryResponseDto, UpdateInquiryRequestDto, UpdateInquiryResponseDto } from './dto';
import { InquiryCreatedEvent } from './events';
import { InquiryMessagesGateway } from './inquiry-messages.gateway';
import { GetAdminInquiriesQuery, GetAdminInquiryMessagesQuery, GetAdminInquiryQuery, GetInquiriesQuery, GetInquiryMessagesQuery, GetInquiryQuery } from './queries';

@ApiTags('inquiries')
@Controller('inquiries')
export class InquiriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBroker: EventBroker,
    private readonly inquiryMessagesGateway: InquiryMessagesGateway,
    private readonly sessionContext: SessionContext,
  ) {}

  @Permission('inquiry:manage', 'inquiry:read')
  @Get('admin')
  @SwaggerApiResponse(GetAdminInquiriesResponseDto)
  async getAdminInquiries(@Query() query: GetAdminInquiriesRequestDto): Promise<GetAdminInquiriesResponseDto> {
    return this.queryBus.execute(new GetAdminInquiriesQuery({ query }));
  }

  @Permission('inquiry:manage', 'inquiry:read')
  @Get('admin/:id')
  @SwaggerApiResponse(GetAdminInquiryResponseDto)
  async getAdminInquiry(@Param('id') id: string): Promise<GetAdminInquiryResponseDto> {
    return this.queryBus.execute(new GetAdminInquiryQuery({ inquiryId: id }));
  }

  @Permission('inquiry:manage', 'inquiry:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(UpdateAdminInquiryResponseDto)
  async updateAdminInquiry(
    @Param('id') id: string,
    @Body() input: UpdateAdminInquiryRequestDto,
  ): Promise<UpdateAdminInquiryResponseDto> {
    const result = await this.commandBus.execute(new UpdateAdminInquiryCommand({
      inquiryId: id,
      input,
    }));
    if (input.status !== undefined) {
      await this.inquiryMessagesGateway.broadcastStatusChange(id, result.status);
    }
    return result;
  }

  @Permission('inquiry:manage', 'inquiry:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteAdminInquiryResponseDto)
  async deleteAdminInquiry(
    @Param('id') id: string,
  ): Promise<DeleteAdminInquiryResponseDto> {
    return this.commandBus.execute(new DeleteAdminInquiryCommand({ inquiryId: id }));
  }

  @Permission('inquiry:manage', 'inquiry:read')
  @Get('admin/:id/messages')
  @SwaggerApiResponse(GetAdminInquiryMessagesResponseDto)
  async getAdminInquiryMessages(
    @Param('id') id: string,
  ): Promise<GetAdminInquiryMessagesResponseDto> {
    return this.queryBus.execute(new GetAdminInquiryMessagesQuery({ inquiryId: id }));
  }

  @Permission('inquiry:manage', 'inquiry:create')
  @Post('admin/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateAdminInquiryMessageResponseDto, HttpStatus.CREATED)
  async createAdminInquiryMessage(
    @Param('id') id: string,
    @Body() input: CreateAdminInquiryMessageRequestDto,
  ): Promise<CreateAdminInquiryMessageResponseDto> {
    const result = await this.commandBus.execute(new CreateAdminInquiryMessageCommand({
      inquiryId: id,
      input,
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
  ): Promise<GetInquiriesResponseDto> {
    return this.queryBus.execute(new GetInquiriesQuery({ query }));
  }

  @Permission('inquiry:create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateInquiryResponseDto, HttpStatus.CREATED)
  async createInquiry(
    @Body() input: CreateInquiryRequestDto,
  ): Promise<CreateInquiryResponseDto> {
    const currentUser = this.sessionContext.requiredUser;
    const result = await this.commandBus.execute(new CreateInquiryCommand({ input }));
    await this.eventBroker.publish(new InquiryCreatedEvent(result, currentUser));
    return result;
  }

  @Permission('inquiry:read')
  @Get(':id')
  @SwaggerApiResponse(GetInquiryResponseDto)
  async getInquiry(
    @Param('id') id: string,
  ): Promise<GetInquiryResponseDto> {
    return this.queryBus.execute(new GetInquiryQuery({ inquiryId: id }));
  }

  @Permission('inquiry:update')
  @Patch(':id')
  @SwaggerApiResponse(UpdateInquiryResponseDto)
  async updateInquiry(
    @Param('id') id: string,
    @Body() input: UpdateInquiryRequestDto,
  ): Promise<UpdateInquiryResponseDto> {
    const result = await this.commandBus.execute(new UpdateInquiryCommand({
      inquiryId: id,
      input,
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
  ): Promise<DeleteInquiryResponseDto> {
    return this.commandBus.execute(new DeleteInquiryCommand({ inquiryId: id }));
  }

  @Permission('inquiry:read')
  @Get(':id/messages')
  @SwaggerApiResponse(GetInquiryMessagesResponseDto)
  async getInquiryMessages(
    @Param('id') id: string,
  ): Promise<GetInquiryMessagesResponseDto> {
    return this.queryBus.execute(new GetInquiryMessagesQuery({ inquiryId: id }));
  }

  @Permission('inquiry:create')
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateInquiryMessageResponseDto, HttpStatus.CREATED)
  async createInquiryMessage(
    @Param('id') id: string,
    @Body() input: CreateInquiryMessageRequestDto,
  ): Promise<CreateInquiryMessageResponseDto> {
    const result = await this.commandBus.execute(new CreateInquiryMessageCommand({
      inquiryId: id,
      input,
    }));
    await this.inquiryMessagesGateway.broadcastMessage(id, result);
    return result;
  }
}

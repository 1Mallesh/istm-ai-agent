import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TicketingService, CreateTicketDto } from './ticketing.service';
import { TicketStatus, TicketPriority, TicketCategory } from '../../database/schemas/ticket.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketingController {
  constructor(private readonly ticketingService: TicketingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  async create(@Body() dto: CreateTicketDto) {
    return this.ticketingService.createTicket(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tickets' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TicketPriority })
  @ApiQuery({ name: 'category', required: false, enum: TicketCategory })
  async findAll(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ticketingService.findAll({ status, priority, category, page, limit });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ticket dashboard statistics' })
  async getStats() {
    return this.ticketingService.getDashboardStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findOne(@Param('id') id: string) {
    return this.ticketingService.findById(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: TicketStatus }) {
    return this.ticketingService.updateStatus(id, body.status);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to ticket' })
  async addComment(
    @Param('id') id: string,
    @Body() body: { author: string; content: string },
  ) {
    return this.ticketingService.addComment(id, body.author, body.content);
  }
}

import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProvisioningService } from './provisioning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('provisioning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('provisioning')
export class ProvisioningController {
  constructor(private readonly provisioningService: ProvisioningService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get provisioning logs' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLogs(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.provisioningService.getLogs({ userId, status, page, limit });
  }

  @Get('logs/:userId')
  @ApiOperation({ summary: 'Get provisioning logs for a specific user' })
  async getUserLogs(@Param('userId') userId: string) {
    return this.provisioningService.getLogs({ userId });
  }

  @Post('retry/:userId')
  @ApiOperation({ summary: 'Retry failed provisioning for a user' })
  async retryFailed(@Param('userId') userId: string) {
    await this.provisioningService.retryFailed(userId);
    return { message: 'Retry initiated' };
  }
}

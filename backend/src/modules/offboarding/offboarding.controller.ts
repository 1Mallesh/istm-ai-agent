import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OffboardingService } from './offboarding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('offboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('offboarding')
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) {}

  @Post('employee/:userId')
  @ApiOperation({ summary: 'Offboard an employee (triggers deprovisioning)' })
  async offboardEmployee(
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.offboardingService.offboardEmployee(userId, body.reason);
  }

  @Get('checklist/:userId')
  @ApiOperation({ summary: 'Get offboarding checklist' })
  async getChecklist(@Param('userId') userId: string) {
    return this.offboardingService.getOffboardingChecklist(userId);
  }
}

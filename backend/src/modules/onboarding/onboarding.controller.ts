import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('employee')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Onboard a new employee' })
  async onboardEmployee(@Body() createUserDto: CreateUserDto) {
    return this.onboardingService.onboardEmployee(createUserDto);
  }

  @Get('status/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get onboarding status' })
  async getStatus(@Param('userId') userId: string) {
    return this.onboardingService.getOnboardingStatus(userId);
  }

  @Post('webhook/blazey')
  @ApiOperation({ summary: 'Webhook endpoint for Blazey integration' })
  async blazeyWebhook(
    @Body() body: { event: string; employeeId: string; payload: any },
  ) {
    return this.onboardingService.handleBlazeWebhook(
      body.event,
      body.employeeId,
      body.payload,
    );
  }
}

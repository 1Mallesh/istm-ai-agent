import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationService } from './integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get()
  @ApiOperation({ summary: 'List all integrations and their status' })
  async getAll() {
    return this.integrationService.getAllIntegrations();
  }

  @Post(':provider/configure')
  @ApiOperation({ summary: 'Configure integration credentials' })
  async configure(
    @Param('provider') provider: string,
    @Body() body: { credentials: Record<string, string>; config?: Record<string, any> },
  ) {
    return this.integrationService.upsertIntegration(provider, body.credentials, body.config);
  }

  @Put(':provider/toggle')
  @ApiOperation({ summary: 'Enable or disable an integration' })
  async toggle(@Param('provider') provider: string, @Body() body: { isEnabled: boolean }) {
    return this.integrationService.toggleIntegration(provider, body.isEnabled);
  }

  @Get(':provider/test')
  @ApiOperation({ summary: 'Test integration connection' })
  async test(@Param('provider') provider: string) {
    const connected = await this.integrationService.testConnection(provider);
    return { provider, connected };
  }
}

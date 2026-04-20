import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminConfigService } from './admin-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminConfigController {
  constructor(private readonly adminConfigService: AdminConfigService) {}

  @Get('dashboard')
  @Roles('admin', 'it_admin')
  @ApiOperation({ summary: 'Admin dashboard overview' })
  async getDashboard() {
    return this.adminConfigService.getDashboard();
  }

  @Get('role-mappings')
  @Roles('admin', 'it_admin')
  @ApiOperation({ summary: 'Get all role-to-tool mappings' })
  async getRoleMappings() {
    return this.adminConfigService.getRoleMappings();
  }

  @Put('role-mappings/:role')
  @Roles('admin', 'it_admin')
  @ApiOperation({ summary: 'Update tools for a specific role' })
  async updateRoleMapping(
    @Param('role') role: string,
    @Body() body: { tools: string[]; displayName?: string },
  ) {
    return this.adminConfigService.updateRoleMapping(role, body.tools, body.displayName);
  }

  @Post('role-mappings/bulk')
  @Roles('admin', 'it_admin')
  @ApiOperation({ summary: 'Bulk update role-to-tool mappings' })
  async bulkUpdateMappings(
    @Body() body: { mappings: Array<{ role: string; tools: string[]; displayName?: string }> },
  ) {
    return this.adminConfigService.bulkUpdateRoleMappings(body.mappings);
  }

  @Get('tools')
  @ApiOperation({ summary: 'List all available integration tools' })
  async getAvailableTools() {
    return this.adminConfigService.getAvailableTools();
  }
}

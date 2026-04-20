import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../../database/schemas/role.schema';
import { Integration, IntegrationDocument } from '../../database/schemas/integration.schema';
import { RoleToolMappingService } from '../provisioning/role-tool-mapping.service';

@Injectable()
export class AdminConfigService {
  private readonly logger = new Logger(AdminConfigService.name);

  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Integration.name) private integrationModel: Model<IntegrationDocument>,
    private readonly roleToolMappingService: RoleToolMappingService,
  ) {}

  async getDashboard() {
    const [totalRoles, totalIntegrations, activeIntegrations] = await Promise.all([
      this.roleModel.countDocuments({ isActive: true }),
      this.integrationModel.countDocuments(),
      this.integrationModel.countDocuments({ isEnabled: true, status: 'active' }),
    ]);

    return {
      roles: { total: totalRoles },
      integrations: { total: totalIntegrations, active: activeIntegrations },
      defaultMappings: this.roleToolMappingService.getDefaultMappings(),
    };
  }

  async getRoleMappings() {
    const [dbRoles, defaults] = await Promise.all([
      this.roleModel.find({ isActive: true }).exec(),
      Promise.resolve(this.roleToolMappingService.getDefaultMappings()),
    ]);

    return {
      configured: dbRoles,
      defaults,
    };
  }

  async updateRoleMapping(roleName: string, tools: string[], displayName?: string) {
    return this.roleToolMappingService.updateRoleMapping(roleName, tools, displayName);
  }

  async bulkUpdateRoleMappings(mappings: Array<{ role: string; tools: string[]; displayName?: string }>) {
    const results = await Promise.all(
      mappings.map(({ role, tools, displayName }) =>
        this.roleToolMappingService.updateRoleMapping(role, tools, displayName),
      ),
    );
    return results;
  }

  async getAvailableTools() {
    return [
      { id: 'slack', name: 'Slack', category: 'communication' },
      { id: 'github', name: 'GitHub', category: 'development' },
      { id: 'jira', name: 'Jira', category: 'project_management' },
      { id: 'zoom', name: 'Zoom', category: 'communication' },
      { id: 'zoho', name: 'Zoho', category: 'hr' },
      { id: 'google_workspace', name: 'Google Workspace', category: 'productivity' },
      { id: 'microsoft_365', name: 'Microsoft 365', category: 'productivity' },
      { id: 'servicenow', name: 'ServiceNow', category: 'itsm' },
      { id: 'sap', name: 'SAP', category: 'erp' },
      { id: 'salesforce', name: 'Salesforce', category: 'crm' },
    ];
  }
}

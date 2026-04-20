import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../../database/schemas/role.schema';

const DEFAULT_ROLE_MAPPINGS: Record<string, string[]> = {
  developer: ['github', 'jira', 'slack', 'zoom'],
  engineer: ['github', 'jira', 'slack', 'zoom'],
  hr: ['zoho', 'slack', 'zoom'],
  sales: ['salesforce', 'slack', 'zoom'],
  finance: ['sap', 'slack', 'zoom'],
  manager: ['jira', 'slack', 'zoom'],
  it_admin: ['github', 'jira', 'slack', 'zoom', 'google_workspace', 'microsoft_365', 'zoho', 'salesforce', 'sap', 'servicenow'],
  marketing: ['salesforce', 'slack', 'zoom'],
  support: ['jira', 'servicenow', 'slack', 'zoom'],
  intern: ['slack', 'zoom'],
  executive: ['slack', 'zoom', 'salesforce', 'jira'],
};

@Injectable()
export class RoleToolMappingService {
  private readonly logger = new Logger(RoleToolMappingService.name);

  constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {}

  async getToolsForRole(roleName: string): Promise<string[]> {
    const normalizedRole = roleName.toLowerCase().replace(/\s+/g, '_');

    try {
      const roleDoc = await this.roleModel
        .findOne({ name: normalizedRole, isActive: true })
        .exec();

      if (roleDoc?.requiredTools?.length > 0) {
        return [...new Set([...roleDoc.requiredTools, ...(roleDoc.optionalTools || [])])];
      }
    } catch (error) {
      this.logger.warn(`Could not find role in DB, using defaults: ${error.message}`);
    }

    const tools = DEFAULT_ROLE_MAPPINGS[normalizedRole] || DEFAULT_ROLE_MAPPINGS['intern'];
    this.logger.log(`Role ${roleName} → tools: ${tools.join(', ')}`);
    return tools;
  }

  async updateRoleMapping(roleName: string, tools: string[], displayName?: string): Promise<Role> {
    const normalized = roleName.toLowerCase().replace(/\s+/g, '_');
    const updated = await this.roleModel
      .findOneAndUpdate(
        { name: normalized },
        {
          $set: {
            name: normalized,
            displayName: displayName || roleName,
            requiredTools: tools,
            isActive: true,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
    return updated;
  }

  async getAllMappings(): Promise<Role[]> {
    return this.roleModel.find({ isActive: true }).exec();
  }

  getDefaultMappings() {
    return DEFAULT_ROLE_MAPPINGS;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegrationAdapter, AccountPayload, AccountResult } from './base.adapter';

@Injectable()
export class GitHubAdapter extends BaseIntegrationAdapter {
  readonly provider = 'github';
  private readonly logger = new Logger(GitHubAdapter.name);
  private readonly baseUrl = 'https://api.github.com';

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.configService.get('GITHUB_TOKEN')}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private get org(): string {
    return this.configService.get<string>('GITHUB_ORG', '');
  }

  async createAccount(payload: AccountPayload): Promise<AccountResult> {
    try {
      const username = await this.resolveGitHubUsername(payload.email);

      if (!username) {
        this.logger.warn(`GitHub: cannot invite ${payload.email} — no GitHub account found`);
        return { email: payload.email, status: 'skipped', reason: 'no_github_account' };
      }

      const response = await axios.post(
        `${this.baseUrl}/orgs/${this.org}/invitations`,
        {
          invitee_id: await this.getUserId(username),
          role: this.mapRoleToGitHub(payload.role),
          team_ids: await this.getTeamIds(payload.role),
        },
        { headers: this.headers },
      );

      this.logger.log(`GitHub: invited ${username} to org ${this.org}`);
      return {
        id: response.data.id?.toString(),
        username,
        email: payload.email,
        githubId: response.data.id,
      };
    } catch (error) {
      this.handleError(error, 'createAccount');
    }
  }

  async deleteAccount(identifier: string): Promise<void> {
    try {
      const username = identifier.includes('@')
        ? await this.resolveGitHubUsername(identifier)
        : identifier;

      if (!username) return;

      await axios.delete(`${this.baseUrl}/orgs/${this.org}/members/${username}`, {
        headers: this.headers,
      });

      this.logger.log(`GitHub: removed ${username} from org ${this.org}`);
    } catch (error) {
      this.handleError(error, 'deleteAccount');
    }
  }

  async updateAccount(identifier: string, payload: Partial<AccountPayload>): Promise<AccountResult> {
    try {
      if (payload.role) {
        const username = identifier.includes('@')
          ? await this.resolveGitHubUsername(identifier)
          : identifier;

        await axios.put(
          `${this.baseUrl}/orgs/${this.org}/memberships/${username}`,
          { role: this.mapRoleToGitHub(payload.role) },
          { headers: this.headers },
        );
      }
      return { email: identifier };
    } catch (error) {
      this.handleError(error, 'updateAccount');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/orgs/${this.org}`, {
        headers: this.headers,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private mapRoleToGitHub(role: string): 'member' | 'admin' {
    return ['it_admin', 'admin', 'cto', 'engineering_lead'].includes(role.toLowerCase())
      ? 'admin'
      : 'member';
  }

  private async resolveGitHubUsername(email: string): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/search/users`, {
        headers: this.headers,
        params: { q: `${email} in:email` },
      });
      return response.data.items?.[0]?.login || null;
    } catch {
      return null;
    }
  }

  private async getUserId(username: string): Promise<number | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${username}`, {
        headers: this.headers,
      });
      return response.data.id;
    } catch {
      return null;
    }
  }

  private async getTeamIds(role: string): Promise<number[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/orgs/${this.org}/teams`, {
        headers: this.headers,
      });
      const teams: any[] = response.data;

      const roleTeamMap: Record<string, string[]> = {
        developer: ['engineering', 'developers'],
        engineer: ['engineering', 'developers'],
        manager: ['leads'],
        hr: [],
      };

      const targetTeamNames = roleTeamMap[role.toLowerCase()] || [];
      return teams
        .filter((t) => targetTeamNames.some((n) => t.slug.includes(n)))
        .map((t) => t.id);
    } catch {
      return [];
    }
  }
}

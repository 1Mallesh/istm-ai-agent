export interface AccountPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  jobTitle?: string;
}

export interface AccountResult {
  id?: string;
  userId?: string;
  accountId?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}

export abstract class BaseIntegrationAdapter {
  abstract readonly provider: string;

  abstract createAccount(payload: AccountPayload): Promise<AccountResult>;
  abstract deleteAccount(identifier: string): Promise<void>;
  abstract updateAccount(identifier: string, payload: Partial<AccountPayload>): Promise<AccountResult>;
  abstract testConnection(): Promise<boolean>;

  protected handleError(error: any, operation: string): never {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    throw new Error(`[${this.provider}] ${operation} failed: ${message}`);
  }
}

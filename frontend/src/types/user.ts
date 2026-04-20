export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type EmployeeType = 'full_time' | 'part_time' | 'contractor' | 'intern';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyEmail?: string;
  role: string;
  department: string;
  jobTitle: string;
  status: UserStatus;
  employeeType: EmployeeType;
  phoneNumber?: string;
  location?: string;
  managerId?: string;
  startDate?: string;
  provisionedServices: string[];
  externalIds: Record<string, string>;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: string;
  department: string;
  jobTitle: string;
  employeeType?: EmployeeType;
  startDate?: string;
  phoneNumber?: string;
  location?: string;
  managerId?: string;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Re-export Redis utilities
export * from './redis';

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  WAREHOUSE = 'WAREHOUSE',
  OPERATOR = 'OPERATOR',
  TECHNICIAN = 'TECHNICIAN',
  DRIVER = 'DRIVER'
}

export enum MachineStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
  ERROR = 'ERROR'
}

export enum TaskStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  isActive: boolean;
}

export interface Machine {
  id: string;
  code: string;
  status: MachineStatus;
  location?: any;
}

// Types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type DashboardStats = {
  totalMachines: number;
  onlineMachines: number;
  totalTasks: number;
  pendingTasks: number;
  totalRevenue: number;
  todayRevenue: number;
  activeUsers: number;
};

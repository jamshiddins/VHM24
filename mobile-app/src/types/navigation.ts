export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TaskDetail: { taskId: string };
  MachineDetail: { machineId: string };
  Incassation: { machineId: string };
  QRScanner: { onScan: (data: string) => void };
  Camera: { onCapture: (uri: string) => void };
  Map: { machines?: any[] };
  Settings: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Machines: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type MachineStatus = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
export type UserRole = 'OPERATOR' | 'TECHNICIAN' | 'MANAGER' | 'WAREHOUSE' | 'ADMIN';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  telegramId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo?: string;
  machineId?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  photos?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Machine {
  id: string;
  serialNumber: string;
  location: string;
  status: MachineStatus;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  lastMaintenance?: string;
  nextMaintenance?: string;
  revenue24h?: number;
  uptime?: number;
  errorCount?: number;
  sensors?: {
    temperature?: number;
    humidity?: number;
    vibration?: number;
    pressure?: number;
  };
}

export interface Analytics {
  totalRevenue: number;
  totalMachines: number;
  activeTasks: number;
  operatorEfficiency: number;
  revenueGrowth: number;
  machineUptime: number;
  errorRate: number;
  completedTasks: number;
}

export interface Incassation {
  id: string;
  machineId: string;
  operatorId: string;
  amount: number;
  photoUrl?: string;
  eventTime: string;
  status: 'COLLECTED' | 'VERIFIED' | 'DEPOSITED';
  notes?: string;
}

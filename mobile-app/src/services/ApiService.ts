import AsyncStorage from '@react-native-async-storage/async-storage';
import { Analytics, Task, Machine, Incassation } from '../types/navigation';

const API_BASE_URL = 'http://localhost:3000/api'; // В production будет реальный URL

class ApiServiceClass {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.loadAuthToken();
  }

  private async loadAuthToken() {
    try {
      this.authToken = await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, redirect to login
        await AsyncStorage.removeItem('authToken');
        throw new Error('Authentication required');
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.authToken = response.token;
    await AsyncStorage.setItem('authToken', response.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.user));

    return response;
  }

  async logout(): Promise<void> {
    this.authToken = null;
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  }

  async validateToken(token: string | null): Promise<boolean> {
    if (!token) return false;
    
    try {
      await this.request('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Analytics
  async getAnalytics(): Promise<Analytics> {
    return this.request<Analytics>('/analytics/dashboard');
  }

  async getAnalyticsDetailed(period: string = 'week'): Promise<any> {
    return this.request(`/analytics/detailed?period=${period}`);
  }

  // Tasks
  async getTasks(filters?: any): Promise<Task[]> {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.request<Task[]>(`/tasks${queryParams}`);
  }

  async getRecentTasks(): Promise<Task[]> {
    return this.request<Task[]>('/tasks/recent');
  }

  async getTaskById(taskId: string): Promise<Task> {
    return this.request<Task>(`/tasks/${taskId}`);
  }

  async updateTaskStatus(taskId: string, status: string, data?: any): Promise<Task> {
    return this.request<Task>(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...data }),
    });
  }

  async addTaskPhoto(taskId: string, photoUri: string): Promise<any> {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'task_photo.jpg',
    } as any);

    return this.request(`/tasks/${taskId}/photos`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Machines
  async getMachines(): Promise<Machine[]> {
    return this.request<Machine[]>('/machines');
  }

  async getMachineById(machineId: string): Promise<Machine> {
    return this.request<Machine>(`/machines/${machineId}`);
  }

  async getMachineStatus(machineId: string): Promise<any> {
    return this.request(`/machines/${machineId}/status`);
  }

  async getMachineSensors(machineId: string): Promise<any> {
    return this.request(`/machines/${machineId}/sensors`);
  }

  // Incassation
  async createIncassation(data: {
    machineId: string;
    amount: number;
    photoUri?: string;
    notes?: string;
  }): Promise<Incassation> {
    if (data.photoUri) {
      const formData = new FormData();
      formData.append('machineId', data.machineId);
      formData.append('amount', data.amount.toString());
      formData.append('photo', {
        uri: data.photoUri,
        type: 'image/jpeg',
        name: 'incassation_photo.jpg',
      } as any);
      if (data.notes) {
        formData.append('notes', data.notes);
      }

      return this.request<Incassation>('/incassations', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      return this.request<Incassation>('/incassations', {
        method: 'POST',
        body: JSON.stringify({
          machineId: data.machineId,
          amount: data.amount,
          notes: data.notes,
        }),
      });
    }
  }

  async getIncassations(): Promise<Incassation[]> {
    return this.request<Incassation[]>('/incassations');
  }

  // Alerts
  async getAlerts(): Promise<any[]> {
    return this.request<any[]>('/alerts');
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.request(`/alerts/${alertId}/acknowledge`, {
      method: 'PUT',
    });
  }

  // User Profile
  async getUserProfile(): Promise<any> {
    return this.request('/users/profile');
  }

  async updateUserProfile(data: any): Promise<any> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // QR Code scanning
  async processQRCode(qrData: string): Promise<any> {
    return this.request('/qr/process', {
      method: 'POST',
      body: JSON.stringify({ qrData }),
    });
  }

  // AI Predictions
  async getAIPredictions(): Promise<any> {
    return this.request('/ai/predictions');
  }

  async getMaintenancePrediction(machineId: string): Promise<any> {
    return this.request(`/ai/maintenance/${machineId}`);
  }

  // Blockchain
  async getBlockchainStats(): Promise<any> {
    return this.request('/blockchain/stats');
  }

  async getBlockchainHistory(): Promise<any> {
    return this.request('/blockchain/history');
  }

  // IoT
  async getIoTData(machineId?: string): Promise<any> {
    const endpoint = machineId ? `/iot/data/${machineId}` : '/iot/data';
    return this.request(endpoint);
  }

  // File Upload
  async uploadFile(file: any, type: string = 'general'): Promise<{ url: string; id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request<{ url: string; id: string }>('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Offline support
  async syncOfflineData(): Promise<void> {
    const offlineData = await AsyncStorage.getItem('offlineData');
    if (offlineData) {
      const data = JSON.parse(offlineData);
      
      // Sync offline actions
      for (const action of data.actions || []) {
        try {
          await this.request(action.endpoint, action.options);
        } catch (error) {
          console.error('Failed to sync offline action:', error);
        }
      }

      // Clear offline data after successful sync
      await AsyncStorage.removeItem('offlineData');
    }
  }

  async saveOfflineAction(endpoint: string, options: RequestInit): Promise<void> {
    const offlineData = await AsyncStorage.getItem('offlineData');
    const data = offlineData ? JSON.parse(offlineData) : { actions: [] };
    
    data.actions.push({
      endpoint,
      options: {
        ...options,
        body: options.body?.toString(), // Convert FormData to string for storage
      },
      timestamp: new Date().toISOString(),
    });

    await AsyncStorage.setItem('offlineData', JSON.stringify(data));
  }
}

export const ApiService = new ApiServiceClass();

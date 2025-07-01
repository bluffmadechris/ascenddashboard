// API Client for Ascend Media Dashboard
// Handles all communication with the backend API server

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    avatar_url?: string;
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  avatar_url?: string;
  phone?: string;
  title?: string;
  department?: string;
  created_at: string;
  updated_at: string;
}

// Token management
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

// API Client class
class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    console.log('API Client initialized with base URL:', this.baseUrl);
  }
  
  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = TokenManager.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };
    
    try {
      console.log(`zzzMaking ${options.method || 'GET'} request to:`, url);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        console.error('API request failed:', {
          status: response.status,
          statusText: response.statusText,
          url: url
        });
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '300';
          const minutes = Math.ceil(parseInt(retryAfter) / 60);
          return {
            success: false,
            message: `Too many attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`
          };
        }
        
        // Handle specific HTTP errors
        if (response.status === 404) {
          return {
            success: false,
            message: 'API endpoint not found. Please check your API configuration.',
          };
        }
        
        if (response.status === 401) {
          TokenManager.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return {
            success: false,
            message: 'Authentication failed. Please log in again.',
          };
        }
        
        if (response.status === 403) {
          return {
            success: false,
            message: 'Access denied. You do not have permission to perform this action.',
          };
        }
      }
      
      const data = await response.json();
      
      // Log remaining rate limit for debugging
      const remaining = response.headers.get('RateLimit-Remaining');
      if (remaining && parseInt(remaining) < 5) {
        console.warn(`Rate limit running low. ${remaining} requests remaining.`);
      }
      
      return data;
      
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and API configuration.',
      };
    }
  }
  
  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
  
  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await this.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    
    if (response.success && response.data?.token) {
      TokenManager.setToken(response.data.token);
    }
    
    return response;
  }
  
  async logout(): Promise<ApiResponse> {
    const response = await this.post('/auth/logout');
    TokenManager.removeToken();
    return response;
  }
  
  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.get<{ user: User }>('/auth/me');
  }
  
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    return this.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }
  
  // User management methods
  async getUsers(): Promise<ApiResponse<{ users: User[]; total: number }>> {
    return this.get<{ users: User[]; total: number }>('/users');
  }
  
  async getUser(id: number): Promise<ApiResponse<{ user: User }>> {
    return this.get<{ user: User }>(`/users/${id}`);
  }
  
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
    phone?: string;
    title?: string;
    department?: string;
  }): Promise<ApiResponse<{ user: User }>> {
    return this.post<{ user: User }>('/users', userData);
  }
  
  async updateUser(
    id: number,
    updates: Partial<User>
  ): Promise<ApiResponse<{ user: User }>> {
    // Map frontend field names to API field names
    const apiUpdates = { ...updates };
    
    // Map avatar to avatar_url for API compatibility
    if ('avatar' in apiUpdates) {
      apiUpdates.avatar_url = apiUpdates.avatar as string;
      delete apiUpdates.avatar;
    }
    
    // Store bio in a field that exists in the API (use department field for bio storage)
    if ('bio' in apiUpdates) {
      // Store bio in the department field as a workaround
      apiUpdates.department = apiUpdates.bio as string;
      delete apiUpdates.bio;
    }
    
    // Remove fields that don't exist in the API
    const fieldsToRemove = ['socialMedia', 'customLinks', 'clientAccess', 'password'];
    fieldsToRemove.forEach(field => {
      if (field in apiUpdates) {
        delete apiUpdates[field as keyof typeof apiUpdates];
      }
    });
    
    const response = await this.put<{ user: User }>(`/users/${id}`, apiUpdates);
    
    // Map API response field names back to frontend field names
    if (response.success && response.data?.user) {
      const user = response.data.user;
      if ('avatar_url' in user) {
        user.avatar = user.avatar_url as string;
      }
    }
    
    return response;
  }
  
  async deleteUser(id: number): Promise<ApiResponse> {
    return this.delete(`/users/${id}`);
  }
  
  // Dashboard methods
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.get('/dashboard/stats');
  }
  
  // Client methods
  async getClients(): Promise<ApiResponse<any>> {
    return this.get('/clients');
  }
  
  async getClient(id: number): Promise<ApiResponse<any>> {
    return this.get(`/clients/${id}`);
  }
  
  async createClient(clientData: any): Promise<ApiResponse<any>> {
    return this.post('/clients', clientData);
  }
  
  async updateClient(id: number, updates: any): Promise<ApiResponse<any>> {
    return this.put(`/clients/${id}`, updates);
  }
  
  async deleteClient(id: number): Promise<ApiResponse> {
    return this.delete(`/clients/${id}`);
  }
  
  // Invoice methods
  async getInvoices(): Promise<ApiResponse<any>> {
    return this.get('/invoices');
  }
  
  async getInvoice(id: number): Promise<ApiResponse<any>> {
    return this.get(`/invoices/${id}`);
  }
  
  async createInvoice(invoiceData: any): Promise<ApiResponse<any>> {
    return this.post('/invoices', invoiceData);
  }
  
  async updateInvoice(id: number, updates: any): Promise<ApiResponse<any>> {
    return this.put(`/invoices/${id}`, updates);
  }
  
  async deleteInvoice(id: number): Promise<ApiResponse> {
    return this.delete(`/invoices/${id}`);
  }
  
  // Contract/File methods
  async uploadContract(file: File, clientId?: number): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('contract', file);
    if (clientId) {
      formData.append('clientId', clientId.toString());
    }
    
    const token = TokenManager.getToken();
    const response = await fetch(`${this.baseUrl}/contracts/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    return response.json();
  }
  
  async getContracts(): Promise<ApiResponse<any>> {
    return this.get('/contracts');
  }
  
  async getContract(id: number): Promise<ApiResponse<any>> {
    return this.get(`/contracts/${id}`);
  }
  
  async downloadContract(id: number): Promise<string | null> {
    const response = await this.get<{ downloadUrl: string }>(`/contracts/${id}/download`);
    return response.success && response.data ? response.data.downloadUrl : null;
  }
  
  async deleteContract(id: number): Promise<ApiResponse> {
    return this.delete(`/contracts/${id}`);
  }
  
  // Calendar methods
  async getCalendarEvents(): Promise<ApiResponse<any>> {
    return this.get('/calendar/events');
  }
  
  async createCalendarEvent(eventData: any): Promise<ApiResponse<any>> {
    return this.post('/calendar/events', eventData);
  }
  
  async updateCalendarEvent(id: number, updates: any): Promise<ApiResponse<any>> {
    return this.put(`/calendar/events/${id}`, updates);
  }
  
  async deleteCalendarEvent(id: number): Promise<ApiResponse> {
    return this.delete(`/calendar/events/${id}`);
  }
  
    // Notification methods
  async getNotifications(): Promise<ApiResponse<any>> {
    return this.get('/notifications');
  }

  async markNotificationAsRead(id: number): Promise<ApiResponse> {
    return this.put(`/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.put('/notifications/read-all');
  }

  async broadcastNotification(notificationData: {
    title: string;
    message: string;
    type?: string;
    roles?: string[];
  }): Promise<ApiResponse> {
    return this.post('/notifications/broadcast', notificationData);
  }

  async createNotification(notificationData: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }): Promise<ApiResponse> {
    return this.post('/notifications', notificationData);
  }

  async deleteNotification(id: number): Promise<ApiResponse> {
    return this.delete(`/notifications/${id}`);
  }
  
  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.get('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export TokenManager for direct access if needed
export { TokenManager }; 
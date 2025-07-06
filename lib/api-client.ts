// API Client for Ascend Media Dashboard
// Handles all communication with the backend API server

// Determine API base URL based on environment
// 1. In development (NODE_ENV === 'development') we prefer NEXT_PUBLIC_API_URL_DEV, falling back to localhost
// 2. In production we use NEXT_PUBLIC_API_URL (which should point at the live API)
const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_API_URL_DEV || 'http://localhost:8000/api'
    : process.env.NEXT_PUBLIC_API_URL || 'https://web-production-a530d.up.railway.app/api';

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

export interface Client {
  id: number
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  status: string
  contract_count: number
  invoice_count: number
  created_at: string
  updated_at: string
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
      console.log(`Making ${options.method || 'GET'} request to:`, url);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        console.error('API request failed:', {
          status: response.status,
          statusText: response.statusText,
          url: url
        });
        
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

        // Generic error response
        return {
          success: false,
          message: 'Request failed. Please try again.',
        };
      }
      
      const data = await response.json();
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
  
  // Client management methods
  async getClients(): Promise<ApiResponse<{ clients: Client[]; pagination: { total: number; page: number; limit: number; pages: number } }>> {
    return this.get('/clients')
  }

  async getClient(id: number): Promise<ApiResponse<{ client: Client }>> {
    return this.get(`/clients/${id}`)
  }

  async createClient(clientData: {
    name: string
    email?: string
    phone?: string
    company?: string
    address?: string
    status?: string
  }): Promise<ApiResponse<{ client: Client }>> {
    return this.post('/clients', clientData)
  }

  async updateClient(
    id: number,
    updates: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at' | 'contract_count' | 'invoice_count'>>
  ): Promise<ApiResponse<{ client: Client }>> {
    return this.put(`/clients/${id}`, updates)
  }

  async deleteClient(id: number): Promise<ApiResponse> {
    return this.delete(`/clients/${id}`)
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
  async getCalendarEvents(params?: {
    start_date?: string;
    end_date?: string;
    client_id?: string;
    page?: number;
    limit?: number;
    user_ids?: string;
  }): Promise<ApiResponse<{ events: any[] }>> {
    let endpoint = '/calendar/events';
    
    if (params) {
      const searchParams = new URLSearchParams();
      
      if (params.start_date) searchParams.append('start_date', params.start_date);
      if (params.end_date) searchParams.append('end_date', params.end_date);
      if (params.client_id) searchParams.append('client_id', params.client_id);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.user_ids) searchParams.append('user_ids', params.user_ids);
      
      const queryString = searchParams.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    
    return this.get<{ events: any[] }>(endpoint);
  }
  
  async createCalendarEvent(eventData: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    location?: string;
    attendees?: string[];
    client_id?: number;
    type?: string;
    status?: string;
    all_day?: boolean;
    created_by: string;
  }): Promise<ApiResponse<{ event: any }>> {
    return this.post<{ event: any }>('/calendar/events', eventData);
  }
  
  async updateCalendarEvent(id: string, updates: {
    title?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    attendees?: string[];
    client_id?: number;
    type?: string;
    status?: string;
  }): Promise<ApiResponse<{ event: any }>> {
    return this.put<{ event: any }>(`/calendar/events/${id}`, updates);
  }
  
  async deleteCalendarEvent(id: string): Promise<ApiResponse> {
    return this.delete(`/calendar/events/${id}`);
  }
  
  // Add meeting request methods
  async getMeetingRequests(type: 'owner' | 'requester'): Promise<ApiResponse<{ requests: any[] }>> {
    return this.get<{ requests: any[] }>(`/calendar/meeting-requests?type=${type}`);
  }

  async createMeetingRequest(data: {
    target_user_id: string;
    subject: string;
    description?: string;
    proposed_date?: string;
  }): Promise<ApiResponse<{ request: any }>> {
    return this.post<{ request: any }>('/calendar/meeting-requests', data);
  }

  async updateMeetingRequest(id: string, updates: {
    status?: 'pending' | 'approved' | 'rejected' | 'scheduled';
    scheduledDate?: string;
    responseMessage?: string;
  }): Promise<ApiResponse<{ request: any }>> {
    return this.put<{ request: any }>(`/calendar/meeting-requests/${id}`, updates);
  }

  async deleteMeetingRequest(id: string): Promise<ApiResponse> {
    return this.delete(`/calendar/meeting-requests/${id}`);
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

  // Password change request methods
  async createPasswordChangeRequest(data: {
    userId: string
    newPassword: string
    reason: string
  }): Promise<ApiResponse> {
    return this.post('/auth/password-change-requests', data);
  }

  async getPasswordChangeRequests(): Promise<ApiResponse<{
    requests: Array<{
      id: string
      userId: string
      userName: string
      newPassword: string
      reason: string
      status: "pending" | "approved" | "denied"
      createdAt: string
      updatedAt: string
    }>
  }>> {
    return this.get('/auth/password-change-requests');
  }

  async approvePasswordChangeRequest(requestId: string): Promise<ApiResponse> {
    return this.post(`/auth/password-change-requests/${requestId}/approve`);
  }

  async denyPasswordChangeRequest(requestId: string): Promise<ApiResponse> {
    return this.post(`/auth/password-change-requests/${requestId}/deny`);
  }

  async updateInvoiceStatus(invoiceId: string, status: string): Promise<ApiResponse<any>> {
    const response = await this.put(`/invoices/status/${invoiceId}`, { status });
    if (!response.success && response.data) {
      return {
        success: false,
        message: response.message || 'Failed to update invoice status',
        data: response.data
      };
    }
    return response;
  }
}

// Create and export the API client instance
const apiClient = new ApiClient();
export { apiClient };
export { apiClient as api };

// Export the class for custom instances
export { ApiClient };

// Export TokenManager for direct access if needed
export { TokenManager }; 
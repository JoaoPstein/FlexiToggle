import axios, { type AxiosInstance, type  AxiosResponse } from 'axios';
import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  Project,
  CreateProjectRequest,
  FeatureFlag,
  CreateFeatureFlagRequest,
  FeatureFlagEvaluationRequest,
  FeatureFlagEvaluationResponse,
  AnalyticsData,
  ApiResponse 
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/api/auth/me');
    return response.data;
  }

  // Project endpoints
  async getProjects(): Promise<Project[]> {
    const response = await this.api.get<Project[]>('/api/projects');
    return response.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.api.get<Project>(`/api/projects/${id}`);
    return response.data;
  }

  async createProject(project: CreateProjectRequest): Promise<Project> {
    const response = await this.api.post<Project>('/api/projects', project);
    return response.data;
  }

  async updateProject(id: string, project: Partial<CreateProjectRequest>): Promise<Project> {
    const response = await this.api.put<Project>(`/api/projects/${id}`, project);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.api.delete(`/api/projects/${id}`);
  }

  // Project Members endpoints
  async getProjectMembers(projectId: string): Promise<any[]> {
    const response = await this.api.get(`/api/projects/${projectId}/members`);
    return response.data;
  }

  async addProjectMember(projectId: string, memberData: { email: string; role: string }): Promise<any> {
    const response = await this.api.post(`/api/projects/${projectId}/members`, memberData);
    return response.data;
  }

  async removeProjectMember(projectId: string, memberId: string): Promise<void> {
    await this.api.delete(`/api/projects/${projectId}/members/${memberId}`);
  }

  // API Keys endpoints
  async getEnvironmentApiKeys(projectId: string, environmentId: string): Promise<any[]> {
    const response = await this.api.get(`/api/projects/${projectId}/environments/${environmentId}/apikeys`);
    return response.data;
  }

  async createApiKey(projectId: string, environmentId: string, keyData: { name: string; type: number }): Promise<any> {
    const response = await this.api.post(`/api/projects/${projectId}/environments/${environmentId}/apikeys`, keyData);
    return response.data;
  }

  // Feature Flag endpoints
  async getFeatureFlags(projectId?: number, environmentId?: number): Promise<FeatureFlag[]> {
    if (!projectId) {
      // Se não há projectId, retorna array vazio ou busca de todos os projetos
      return [];
    }
    
    const params = new URLSearchParams();
    if (environmentId) params.append('environmentId', environmentId.toString());
    
    const response = await this.api.get<FeatureFlag[]>(`/api/projects/${projectId}/FeatureFlags?${params}`);
    return response.data;
  }

  async getFeatureFlag(projectId: number, id: number): Promise<FeatureFlag> {
    const response = await this.api.get<FeatureFlag>(`/api/projects/${projectId}/FeatureFlags/${id}`);
    return response.data;
  }

  async createFeatureFlag(flag: CreateFeatureFlagRequest): Promise<FeatureFlag> {
    const response = await this.api.post<FeatureFlag>(`/api/projects/${flag.projectId}/FeatureFlags`, flag);
    return response.data;
  }

  async updateFeatureFlag(projectId: number, id: number, flag: Partial<CreateFeatureFlagRequest>): Promise<FeatureFlag> {
    const response = await this.api.put<FeatureFlag>(`/api/projects/${projectId}/FeatureFlags/${id}`, flag);
    return response.data;
  }

  async deleteFeatureFlag(projectId: number, id: number): Promise<void> {
    await this.api.delete(`/api/projects/${projectId}/FeatureFlags/${id}`);
  }

  async toggleFeatureFlag(projectId: number, id: number, environmentId: number, isEnabled: boolean): Promise<any> {
    const response = await this.api.post(`/api/projects/${projectId}/FeatureFlags/${id}/environments/${environmentId}/toggle`, {
      isEnabled: isEnabled
    });
    return response.data;
  }

  // Evaluation endpoints
  async evaluateFeatureFlag(request: FeatureFlagEvaluationRequest): Promise<FeatureFlagEvaluationResponse> {
    const response = await this.api.post<FeatureFlagEvaluationResponse>('/api/evaluation', request);
    return response.data;
  }

  // Analytics endpoints
  async getAnalytics(projectId?: number, environmentId?: number, days = 30): Promise<AnalyticsData> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    
    const params = new URLSearchParams();
    if (environmentId) params.append('environmentId', environmentId.toString());
    params.append('days', days.toString());
    
    const response = await this.api.get<AnalyticsData>(`/api/projects/${projectId}/analytics/dashboard?${params}`);
    return response.data;
  }

  // Analytics for specific feature flag
  async getFeatureFlagAnalytics(projectId: number, featureFlagId: number, environmentId?: number, days = 30): Promise<any> {
    const params = new URLSearchParams();
    if (environmentId) params.append('environmentId', environmentId.toString());
    params.append('days', days.toString());
    
    const response = await this.api.get(`/api/projects/${projectId}/analytics/feature-flags/${featureFlagId}?${params}`);
    return response.data;
  }

  // Performance analytics
  async getPerformanceAnalytics(projectId: number, hours = 24): Promise<any> {
    const params = new URLSearchParams();
    params.append('hours', hours.toString());
    
    const response = await this.api.get(`/api/projects/${projectId}/analytics/performance?${params}`);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;

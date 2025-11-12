// Auth Types
export interface User {
  Id: number;
  Email: string;
  Name: string;
  Role: 'Admin' | 'Developer' | 'Viewer';
  IsActive: boolean;
  CreatedAt: string;
  LastLoginAt?: string;
}

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface RegisterRequest {
  Name: string;
  Email: string;
  Password: string;
}

export interface AuthResponse {
  Token: string;
  User: User;
  ExpiresAt: string;
}

// Project Types
export interface Project {
  Id: number;
  Name: string;
  Description: string;
  Key: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy: User;
  Environments: Environment[];
  Members: ProjectMember[];
  FeatureFlagsCount: number;
}

export interface CreateProjectRequest {
  Name: string;
  Description: string;
  Key: string;
}

export interface ProjectMember {
  Id: number;
  User: User;
  Role: string;
  JoinedAt: string;
}

// Environment Types
export interface Environment {
  Id: number;
  Name: string;
  Key: string;
  Description: string;
  IsActive: boolean;
  SortOrder: number;
  CreatedAt: string;
  ApiKeys: ApiKey[];
}

export interface ApiKey {
  Id: number;
  Name: string;
  KeyPrefix: string;
  Type: string;
  IsActive: boolean;
  CreatedAt: string;
  ExpiresAt?: string;
  LastUsedAt?: string;
  CreatedBy: User;
}

// Feature Flag Types
export interface FeatureFlag {
  Id: number;
  Name: string;
  Description?: string;
  Key: string;
  Type: string;
  IsArchived: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy: User;
  Environments: FeatureFlagEnvironment[];
  Tags: Tag[];
}

export interface FeatureFlagEnvironment {
  Id: number;
  IsEnabled: boolean;
  DefaultValue?: string;
  UpdatedAt: string;
  Environment: Environment;
  UpdatedBy?: User;
  ActivationStrategies: ActivationStrategy[];
}

export interface ActivationStrategy {
  Id: number;
  Name: string;
  Type: string;
  Parameters?: any;
  Constraints?: any;
  SortOrder: number;
  IsEnabled: boolean;
  CreatedAt: string;
}

export interface Tag {
  Id: number;
  Name: string;
  Color: string;
  CreatedAt: string;
}

export enum FeatureFlagType {
  Boolean = 0,
  String = 1,
  Number = 2,
  Json = 3
}

export enum StrategyType {
  Default = 'Default',
  UserIds = 'UserIds',
  Percentage = 'Percentage',
  Gradual = 'Gradual',
  UserAttribute = 'UserAttribute',
  IpAddress = 'IpAddress',
  Hostname = 'Hostname'
}

export interface CreateFeatureFlagRequest {
  Name: string;
  Description?: string;
  Key: string;
  Type: FeatureFlagType;
  TagIds?: number[];
  ProjectId: number;
}

// Evaluation Types
export interface FeatureFlagEvaluationRequest {
  featureFlagKey: string;
  userId?: string;
  sessionId?: string;
  remoteAddress?: string;
  properties?: Record<string, any>;
}

export interface FeatureFlagEvaluationResponse {
  key: string;
  value: any;
  enabled: boolean;
  strategyResults: StrategyResult[];
}

export interface StrategyResult {
  strategyName: string;
  result: boolean;
  parameters: Record<string, any>;
}

// Analytics Types
export interface AnalyticsData {
  flagUsage: FlagUsageMetric[];
  userEngagement: UserEngagementMetric[];
  performance: PerformanceMetric[];
}

export interface FlagUsageMetric {
  flagKey: string;
  evaluations: number;
  uniqueUsers: number;
  environment: string;
  date: string;
}

export interface UserEngagementMetric {
  environment: string;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  date: string;
}

export interface PerformanceMetric {
  environment: string;
  avgResponseTime: number;
  evaluations: number;
  errorRate: number;
  date: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// UI Types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox' | 'number';
  required?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  validation?: any;
}

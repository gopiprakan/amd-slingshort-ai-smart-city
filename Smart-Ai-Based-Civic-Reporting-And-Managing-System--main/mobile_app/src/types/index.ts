// Core type definitions for the Civic Report App

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  createdAt: Date;
  isVerified: boolean;
  userType?: 'citizen' | 'engineer';
  engineerId?: string;
  department?: string;
  specialization?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: Priority;
  status: IssueStatus;
  location: Location;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  assignedDepartment?: string;
  estimatedResolution?: Date;
  actualResolution?: Date;
  upvotes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: Date;
  isOfficial: boolean;
}

export enum IssueCategory {
  ROADS = 'roads',
  ELECTRICITY = 'electricity',
  WATER = 'water',
  SANITATION = 'sanitation',
  STREETLIGHTS = 'streetlights',
  DRAINAGE = 'drainage',
  TRAFFIC = 'traffic',
  PARKS = 'parks',
  OTHER = 'other'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum IssueStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface IssueFilters {
  category?: IssueCategory;
  status?: IssueStatus;
  priority?: Priority;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'issue_update' | 'new_comment' | 'resolution' | 'general';
  issueId?: string;
  createdAt: Date;
  isRead: boolean;
}
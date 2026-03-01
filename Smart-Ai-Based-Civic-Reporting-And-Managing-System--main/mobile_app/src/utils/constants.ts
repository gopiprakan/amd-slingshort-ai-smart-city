import { IssueCategory, Priority } from '../types/index';

// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://localhost:3000/api'
    : 'https://your-production-api.com/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Civic Reporter',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@civicreporter.com',
  PRIVACY_POLICY_URL: 'https://civicreporter.com/privacy',
  TERMS_URL: 'https://civicreporter.com/terms',
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_REGION: {
    latitude: 23.3441, // Ranchi, Jharkhand
    longitude: 85.3096,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  LOCATION_ACCURACY_THRESHOLD: 100, // meters
  MAX_NEARBY_RADIUS: 5, // kilometers
};

// Image Configuration
export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_WIDTH: 1024,
  MAX_HEIGHT: 1024,
  QUALITY: 0.8,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

// Issue Categories with Display Names and Icons
export const ISSUE_CATEGORIES = [
  {
    key: IssueCategory.ROADS,
    label: 'Roads & Infrastructure',
    icon: 'road',
    color: '#FF6B6B',
    description: 'Potholes, road damage, construction issues',
  },
  {
    key: IssueCategory.ELECTRICITY,
    label: 'Electricity',
    icon: 'flash',
    color: '#4ECDC4',
    description: 'Power outages, electrical hazards',
  },
  {
    key: IssueCategory.WATER,
    label: 'Water Supply',
    icon: 'water',
    color: '#45B7D1',
    description: 'Water shortage, pipe leaks, quality issues',
  },
  {
    key: IssueCategory.SANITATION,
    label: 'Sanitation',
    icon: 'trash',
    color: '#96CEB4',
    description: 'Garbage collection, cleanliness issues',
  },
  {
    key: IssueCategory.STREETLIGHTS,
    label: 'Street Lights',
    icon: 'lightbulb',
    color: '#FFEAA7',
    description: 'Non-functional street lights, dark areas',
  },
  {
    key: IssueCategory.DRAINAGE,
    label: 'Drainage',
    icon: 'trending-down',
    color: '#DDA0DD',
    description: 'Blocked drains, waterlogging',
  },
  {
    key: IssueCategory.TRAFFIC,
    label: 'Traffic',
    icon: 'car',
    color: '#FFB74D',
    description: 'Traffic signals, congestion, parking',
  },
  {
    key: IssueCategory.PARKS,
    label: 'Parks & Recreation',
    icon: 'leaf',
    color: '#81C784',
    description: 'Park maintenance, recreational facilities',
  },
  {
    key: IssueCategory.OTHER,
    label: 'Other',
    icon: 'help-circle',
    color: '#B0BEC5',
    description: 'Other civic issues',
  },
];

// Priority Levels
export const PRIORITY_LEVELS = [
  {
    key: Priority.LOW,
    label: 'Low',
    color: '#4CAF50',
    description: 'Non-urgent, can wait',
  },
  {
    key: Priority.MEDIUM,
    label: 'Medium',
    color: '#FF9800',
    description: 'Moderate urgency',
  },
  {
    key: Priority.HIGH,
    label: 'High',
    color: '#F44336',
    description: 'Needs quick attention',
  },
  {
    key: Priority.URGENT,
    label: 'Urgent',
    color: '#9C27B0',
    description: 'Immediate action required',
  },
];

// Status Colors and Labels
export const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#FFC107' },
  acknowledged: { label: 'Acknowledged', color: '#2196F3' },
  in_progress: { label: 'In Progress', color: '#FF9800' },
  resolved: { label: 'Resolved', color: '#4CAF50' },
  rejected: { label: 'Rejected', color: '#F44336' },
};

// Theme Colors
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  light: '#F2F2F7',
  dark: '#1C1C1E',
  gray: '#8E8E93',
  white: '#FFFFFF',
  black: '#000000',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: 'bold' as const },
  h2: { fontSize: 28, fontWeight: 'bold' as const },
  h3: { fontSize: 24, fontWeight: '600' as const },
  h4: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: 'normal' as const },
  caption: { fontSize: 14, fontWeight: 'normal' as const },
  small: { fontSize: 12, fontWeight: 'normal' as const },
};

// Animation Durations
export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  THEME_PREFERENCE: 'theme_preference',
  NOTIFICATION_SETTINGS: 'notification_settings',
  LOCATION_PERMISSION: 'location_permission',
};

// Validation Rules
export const VALIDATION = {
  PHONE_REGEX: /^[6-9]\d{9}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 500,
};
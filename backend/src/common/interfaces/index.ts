/**
 * Common interfaces for the application
 */

// User roles
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

// Order status enum
export enum OrderStatus {
  PENDING = "pending",
  PAID = "paid",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

// Payment status enum
export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

// JWT payload interface
export interface JwtPayload {
  sub: string; // Admin ID
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Auth response interface
export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// API response interface
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination interface
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

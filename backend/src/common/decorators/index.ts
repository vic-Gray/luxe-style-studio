import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from "@nestjs/common";
import { JwtPayload } from "../interfaces";

/**
 * Custom decorator to extract current user from request
 * Usage: @CurrentUser() user: JwtPayload
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Custom decorator to extract specific fields from current user
 * Usage: @CurrentUser('email') email: string
 */
export const CurrentUserField = createParamDecorator(
  (field: keyof JwtPayload, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.[field];
  },
);

// Role-based access control keys
export const ROLES_KEY = "roles";

// Decorator to set required roles
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Public route decorator - marks route as publicly accessible
 */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

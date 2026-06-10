export declare const IS_PUBLIC_KEY = "isPublic";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare const OPTIONAL_AUTH_KEY = "optionalAuth";
export declare const OptionalAuth: () => import("@nestjs/common").CustomDecorator<string>;
export declare const PERMISSIONS_KEY = "permissions";
export declare const RequirePermissions: (...permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const ROLES_KEY = "roles";
export declare const RequireRoles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;

export interface JwtPayload {
    sub: string;
    email?: string | null;
    phone?: string | null;
    role: string;
}
export interface AuthUser {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
    roleId: string;
    permissions: string[];
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export interface AuthUserResponse {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
    isVerified: boolean;
    isProfileComplete?: boolean;
    profileStatus?: string | null;
    ownerType?: string | null;
}
export interface AuthResponse extends TokenPair {
    user: AuthUserResponse;
    permissions: string[];
}
export interface MeResponse {
    user: AuthUserResponse;
    permissions: string[];
}
export interface RegisterPendingResponse {
    message: string;
    user: AuthUserResponse;
}

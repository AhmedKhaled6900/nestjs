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
export interface AuthResponse extends TokenPair {
    user: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        role: string;
    };
}

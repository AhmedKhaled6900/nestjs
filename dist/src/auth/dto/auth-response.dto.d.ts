export declare class UserResponseDto {
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
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: UserResponseDto;
    permissions: string[];
}
export declare class MeResponseDto {
    user: UserResponseDto;
    permissions: string[];
}
export declare class RegisterPendingResponseDto {
    message: string;
    user: UserResponseDto;
}
export declare class MessageResponseDto {
    message: string;
}

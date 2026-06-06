export declare class UserResponseDto {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: UserResponseDto;
}
export declare class MessageResponseDto {
    message: string;
}

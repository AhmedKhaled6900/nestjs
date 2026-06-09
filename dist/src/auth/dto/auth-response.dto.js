"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageResponseDto = exports.RegisterPendingResponseDto = exports.AuthResponseDto = exports.UserResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class UserResponseDto {
}
exports.UserResponseDto = UserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-here' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ahmed Ali' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ahmed@example.com', nullable: true }),
    __metadata("design:type", Object)
], UserResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+201234567890', nullable: true }),
    __metadata("design:type", Object)
], UserResponseDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RoleName, example: 'CUSTOMER' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Whether email has been verified' }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'True if owner submitted extended profile (not INCOMPLETE)',
        example: false,
    }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "isProfileComplete", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ProfileStatus, example: 'INCOMPLETE' }),
    __metadata("design:type", Object)
], UserResponseDto.prototype, "profileStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: null, description: 'Set after profile completion' }),
    __metadata("design:type", Object)
], UserResponseDto.prototype, "ownerType", void 0);
class AuthResponseDto {
}
exports.AuthResponseDto = AuthResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'JWT access token (15 min)' }),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'JWT refresh token (7 days)' }),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: UserResponseDto }),
    __metadata("design:type", UserResponseDto)
], AuthResponseDto.prototype, "user", void 0);
class RegisterPendingResponseDto {
}
exports.RegisterPendingResponseDto = RegisterPendingResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Registration successful. Please verify your email.' }),
    __metadata("design:type", String)
], RegisterPendingResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: UserResponseDto }),
    __metadata("design:type", UserResponseDto)
], RegisterPendingResponseDto.prototype, "user", void 0);
class MessageResponseDto {
}
exports.MessageResponseDto = MessageResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'OTP sent successfully' }),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "message", void 0);
//# sourceMappingURL=auth-response.dto.js.map
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
exports.validate = validate;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var Environment;
(function (Environment) {
    Environment["Development"] = "development";
    Environment["Production"] = "production";
    Environment["Test"] = "test";
})(Environment || (Environment = {}));
class EnvironmentVariables {
    constructor() {
        this.NODE_ENV = Environment.Development;
    }
}
__decorate([
    (0, class_validator_1.IsEnum)(Environment),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "NODE_ENV", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "DATABASE_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(32),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_ACCESS_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(32),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_REFRESH_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_ACCESS_EXPIRES_IN", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_REFRESH_EXPIRES_IN", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "GOOGLE_CLIENT_ID", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "GOOGLE_CLIENT_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "GOOGLE_CALLBACK_URL", void 0);
__decorate([
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "APP_URL", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CORS_ORIGIN", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "SWAGGER_ENABLED", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "SEED_ADMIN", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "ADMIN_EMAIL", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "ADMIN_PASSWORD", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "PORT", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "RESEND_API_KEY", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "RESEND_FROM", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "FIREBASE_PROJECT_ID", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "FIREBASE_CLIENT_EMAIL", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "FIREBASE_PRIVATE_KEY", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "PAYMOB_API_KEY", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "PAYMOB_INTEGRATION_ID", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CLOUDINARY_URL", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CLOUDINARY_CLOUD_NAME", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CLOUDINARY_API_KEY", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CLOUDINARY_API_SECRET", void 0);
function validate(config) {
    const nodeEnv = config.NODE_ENV ?? 'development';
    const isProduction = nodeEnv === 'production';
    const railwayDomain = config.RAILWAY_PUBLIC_DOMAIN;
    const defaultAppUrl = railwayDomain
        ? `https://${railwayDomain}`
        : 'http://localhost:3000';
    const normalized = {
        ...config,
        NODE_ENV: nodeEnv,
        APP_URL: config.APP_URL ?? defaultAppUrl,
        JWT_ACCESS_SECRET: config.JWT_ACCESS_SECRET ?? 'dev-access-secret-min-32-chars-long!!',
        JWT_REFRESH_SECRET: config.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-min-32-chars-long!!',
    };
    if (!isProduction) {
        return normalized;
    }
    const validated = (0, class_transformer_1.plainToInstance)(EnvironmentVariables, normalized, {
        enableImplicitConversion: true,
    });
    const errors = (0, class_validator_1.validateSync)(validated, { skipMissingProperties: false });
    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return { ...normalized, ...validated };
}
//# sourceMappingURL=env.validation.js.map
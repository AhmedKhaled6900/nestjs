"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const env_validation_1 = require("./config/env.validation");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const property_module_1 = require("./property/property.module");
const health_module_1 = require("./health/health.module");
const owner_module_1 = require("./owner/owner.module");
const category_module_1 = require("./category/category.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validate: env_validation_1.validate,
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: parseInt(process.env.OTP_RATE_LIMIT_TTL ?? '60', 10) * 1000,
                    limit: parseInt(process.env.OTP_RATE_LIMIT_MAX ?? '3', 10),
                },
            ]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            property_module_1.PropertyModule,
            owner_module_1.OwnerModule,
            category_module_1.CategoryModule,
            health_module_1.HealthModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
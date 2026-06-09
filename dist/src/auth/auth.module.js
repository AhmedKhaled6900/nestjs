"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const auth_controller_1 = require("./controllers/auth.controller");
const auth_guards_1 = require("./guards/auth.guards");
const otp_service_1 = require("./otp/otp.service");
const auth_service_1 = require("./services/auth.service");
const password_service_1 = require("./services/password.service");
const token_service_1 = require("./services/token.service");
const google_strategy_1 = require("./strategies/google.strategy");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const email_service_1 = require("./email/email.service");
function isGoogleOAuthConfigured() {
    return Boolean(process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CALLBACK_URL &&
        process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id');
}
const googleProviders = isGoogleOAuthConfigured() ? [google_strategy_1.GoogleStrategy] : [];
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [passport_1.PassportModule.register({ defaultStrategy: 'jwt' }), jwt_1.JwtModule.register({})],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            token_service_1.TokenService,
            password_service_1.PasswordService,
            otp_service_1.OtpService,
            email_service_1.EmailService,
            jwt_strategy_1.JwtStrategy,
            ...googleProviders,
            { provide: core_1.APP_GUARD, useClass: auth_guards_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: auth_guards_1.PermissionsGuard },
            { provide: core_1.APP_GUARD, useClass: auth_guards_1.RolesGuard },
        ],
        exports: [auth_service_1.AuthService, token_service_1.TokenService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map
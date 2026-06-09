"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const isProduction = configService.get('NODE_ENV') === 'production';
    const corsOrigin = configService.get('CORS_ORIGIN', '*');
    const swaggerEnabled = configService.get('SWAGGER_ENABLED', isProduction ? 'false' : 'true') ===
        'true';
    app.enableCors({
        origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
        credentials: true,
    });
    if (isProduction) {
        app.getHttpAdapter().getInstance().set('trust proxy', 1);
    }
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    if (swaggerEnabled) {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Aqar API')
            .setDescription('Rental Property Platform — Authentication, Authorization (RBAC), Properties & Bookings')
            .setVersion('1.0')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' }, 'access-token')
            .addTag('Auth', 'Registration, login, OTP, OAuth, password reset & tokens')
            .addTag('Categories', 'Property category tree')
            .addTag('Properties', 'Property listings and images')
            .addTag('Admin - Properties', 'Admin property review')
            .addTag('Bookings', 'Booking management (RBAC protected)')
            .addTag('Health', 'Health check')
            .addTag('Owner Profile', 'Owner KYC profile completion')
            .addTag('Admin - Owner Review', 'Admin approve/reject owner profiles')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                tagsSorter: 'alpha',
                operationsSorter: 'method',
            },
        });
    }
    const port = process.env.PORT || 8080;
    await app.listen(port, '0.0.0.0');
    console.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
    console.log(`Server:      listening on 0.0.0.0:${port}`);
    if (swaggerEnabled) {
        console.log(`Swagger:     /api/docs`);
    }
}
bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map
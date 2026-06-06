"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
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
            .addTag('Properties', 'Property management (RBAC protected)')
            .addTag('Bookings', 'Booking management (RBAC protected)')
            .addTag('Health', 'Health check')
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
    const port = parseInt(configService.get('PORT', '3000'), 10);
    await app.listen(port);
    console.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
    console.log(`Server:      http://localhost:${port}`);
    if (swaggerEnabled) {
        console.log(`Swagger:     http://localhost:${port}/api/docs`);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map
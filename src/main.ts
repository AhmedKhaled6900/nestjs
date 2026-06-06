import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  const swaggerEnabled =
    configService.get<string>('SWAGGER_ENABLED', isProduction ? 'false' : 'true') ===
    'true';

  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  if (isProduction) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Aqar API')
      .setDescription(
        'Rental Property Platform — Authentication, Authorization (RBAC), Properties & Bookings',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'access-token',
      )
      .addTag('Auth', 'Registration, login, OTP, OAuth, password reset & tokens')
      .addTag('Properties', 'Property management (RBAC protected)')
      .addTag('Bookings', 'Booking management (RBAC protected)')
      .addTag('Health', 'Health check')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'method',
      },
    });
  }

  const port = parseInt(configService.get<string>('PORT', '3000'), 10);
  await app.listen(port);

  console.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
  console.log(`Server:      http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(`Swagger:     http://localhost:${port}/api/docs`);
  }
}

bootstrap();

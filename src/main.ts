import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

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
      .addTag('Categories', 'Property category tree')
      .addTag('Properties', 'Property listings and images')
      .addTag('Admin - Properties', 'Admin property review')
      .addTag('Bookings', 'Booking management (RBAC protected)')
      .addTag('Health', 'Health check')
      .addTag('Owner Profile', 'Owner KYC profile completion')
      .addTag('Admin - Owner Review', 'Admin approve/reject owner profiles')
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

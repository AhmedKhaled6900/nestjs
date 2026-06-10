import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { buildSwaggerDocument } from './swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.set('etag', false);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/uploads/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    next();
  });

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
    const document = buildSwaggerDocument(app);
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

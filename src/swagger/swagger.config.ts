import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function buildSwaggerDocument(app: INestApplication) {
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
    .addTag('Categories', 'Main property categories')
    .addTag('Subcategories', 'Property subcategories (public read)')
    .addTag('Admin - Categories', 'Admin main category CRUD')
    .addTag('Admin - Subcategories', 'Admin subcategory CRUD')
    .addTag('Properties', 'Property listings and images')
    .addTag('Admin - Properties', 'Admin property review')
    .addTag('Bookings', 'Booking management (RBAC protected)')
    .addTag('Health', 'Health check')
    .addTag('Owner Profile', 'Owner KYC profile completion')
    .addTag('Admin - Owner Review', 'Admin approve/reject owner profiles')
    .addTag('Notifications', 'In-app inbox + FCM push')
    .build();

  return SwaggerModule.createDocument(app, config);
}

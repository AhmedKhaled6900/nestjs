import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? '';
  if (url.includes('-pooler') && !url.includes('pgbouncer=true')) {
    return `${url}${url.includes('?') ? '&' : '?'}pgbouncer=true`;
  }
  return url;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: { url: resolveDatabaseUrl() },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected');
    } catch (error) {
      this.logger.error('Database connection failed on startup — app will retry on requests', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

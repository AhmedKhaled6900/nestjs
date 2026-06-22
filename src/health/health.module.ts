import { Module } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/permissions.decorator';
import { UploadModule } from '../upload/upload.module';
import { UploadService } from '../upload/upload.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  /** Liveness — no DB check (used by Railway/Docker health probes) */
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      uploadStorage: this.uploadService.getStorageMode(),
      timestamp: new Date().toISOString(),
    };
  }

  /** Readiness — includes DB connectivity */
  @Public()
  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [UploadModule],
  controllers: [HealthController],
})
export class HealthModule {}

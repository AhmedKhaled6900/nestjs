import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
export declare class HealthController {
    private readonly prisma;
    private readonly uploadService;
    constructor(prisma: PrismaService, uploadService: UploadService);
    check(): {
        status: string;
        uploadStorage: "cloudinary" | "local";
        timestamp: string;
    };
    ready(): Promise<{
        status: string;
        db: string;
        timestamp: string;
    }>;
}
export declare class HealthModule {
}

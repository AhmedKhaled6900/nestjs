import { PrismaService } from '../prisma/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    check(): {
        status: string;
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

import { AuthUser } from '../auth/interfaces/auth.interface';
export declare class PropertyController {
    findAll(user: AuthUser): {
        message: string;
        requestedBy: {
            id: string;
            role: string;
        };
    };
    create(body: Record<string, unknown>, user: AuthUser): {
        message: string;
        ownerId: string;
        data: Record<string, unknown>;
    };
    update(id: string, body: Record<string, unknown>, user: AuthUser): {
        message: string;
        ownerId: string;
        data: Record<string, unknown>;
    };
    publish(id: string, user: AuthUser): {
        message: string;
        publishedBy: string;
    };
    remove(id: string, user: AuthUser): {
        message: string;
        deletedBy: string;
    };
    adminListAll(user: AuthUser): {
        message: string;
        adminId: string;
    };
}
export declare class BookingController {
    create(body: Record<string, unknown>, user: AuthUser): {
        message: string;
        customerId: string;
        data: Record<string, unknown>;
    };
    myBookings(user: AuthUser): {
        message: string;
        userId: string;
    };
    cancel(id: string, user: AuthUser): {
        message: string;
        cancelledBy: string;
    };
}

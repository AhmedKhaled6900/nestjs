import { AuthUser } from '../auth/interfaces/auth.interface';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyImageDto, UploadPropertyImagesDto } from './dto/property-image.dto';
import { QueryOwnerPropertyDto, QueryPropertyDto } from './dto/query-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyImageService } from './property-image.service';
import { PropertyService } from './property.service';
export declare class PropertyController {
    private readonly propertyService;
    private readonly propertyImageService;
    constructor(propertyService: PropertyService, propertyImageService: PropertyImageService);
    findApproved(query: QueryPropertyDto): Promise<import("../common/dto/pagination.dto").PaginatedResult<{
        id: string;
        title: string;
        description: string;
        price: number;
        city: string;
        area: string;
        address: string;
        latitude: number | null;
        longitude: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        areaSize: number | null;
        purpose: import(".prisma/client").$Enums.PropertyPurpose;
        status: import(".prisma/client").$Enums.PropertyStatus;
        categoryId: string;
        category: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
        };
        ownerId: string;
        owner: ({
            id: string;
            name: string;
        } & {
            id: string;
            name: string;
            email?: string | null;
            phone?: string | null;
        }) | undefined;
        rejectionReason: string | null;
        videoUrl: string | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        images: {
            id: string;
            imageUrl: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>>;
    findMine(user: AuthUser, query: QueryOwnerPropertyDto): Promise<import("../common/dto/pagination.dto").PaginatedResult<{
        id: string;
        title: string;
        description: string;
        price: number;
        city: string;
        area: string;
        address: string;
        latitude: number | null;
        longitude: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        areaSize: number | null;
        purpose: import(".prisma/client").$Enums.PropertyPurpose;
        status: import(".prisma/client").$Enums.PropertyStatus;
        categoryId: string;
        category: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
        };
        ownerId: string;
        owner: ({
            id: string;
            name: string;
        } & {
            id: string;
            name: string;
            email?: string | null;
            phone?: string | null;
        }) | undefined;
        rejectionReason: string | null;
        videoUrl: string | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        images: {
            id: string;
            imageUrl: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>>;
    findOne(id: string, user?: AuthUser): Promise<{
        id: string;
        title: string;
        description: string;
        price: number;
        city: string;
        area: string;
        address: string;
        latitude: number | null;
        longitude: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        areaSize: number | null;
        purpose: import(".prisma/client").$Enums.PropertyPurpose;
        status: import(".prisma/client").$Enums.PropertyStatus;
        categoryId: string;
        category: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
        };
        ownerId: string;
        owner: ({
            id: string;
            name: string;
        } & {
            id: string;
            name: string;
            email?: string | null;
            phone?: string | null;
        }) | undefined;
        rejectionReason: string | null;
        videoUrl: string | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        images: {
            id: string;
            imageUrl: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(user: AuthUser, dto: CreatePropertyDto): Promise<{
        id: string;
        title: string;
        description: string;
        price: number;
        city: string;
        area: string;
        address: string;
        latitude: number | null;
        longitude: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        areaSize: number | null;
        purpose: import(".prisma/client").$Enums.PropertyPurpose;
        status: import(".prisma/client").$Enums.PropertyStatus;
        categoryId: string;
        category: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
        };
        ownerId: string;
        owner: ({
            id: string;
            name: string;
        } & {
            id: string;
            name: string;
            email?: string | null;
            phone?: string | null;
        }) | undefined;
        rejectionReason: string | null;
        videoUrl: string | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        images: {
            id: string;
            imageUrl: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, user: AuthUser, dto: UpdatePropertyDto): Promise<{
        id: string;
        title: string;
        description: string;
        price: number;
        city: string;
        area: string;
        address: string;
        latitude: number | null;
        longitude: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        areaSize: number | null;
        purpose: import(".prisma/client").$Enums.PropertyPurpose;
        status: import(".prisma/client").$Enums.PropertyStatus;
        categoryId: string;
        category: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
        };
        ownerId: string;
        owner: ({
            id: string;
            name: string;
        } & {
            id: string;
            name: string;
            email?: string | null;
            phone?: string | null;
        }) | undefined;
        rejectionReason: string | null;
        videoUrl: string | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        images: {
            id: string;
            imageUrl: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, user: AuthUser): Promise<{
        message: string;
    }>;
    uploadImages(id: string, user: AuthUser, files: Express.Multer.File[], dto: UploadPropertyImagesDto): Promise<{
        message: string;
        images: {
            id: string;
            imageUrl: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        property: {
            id: string;
            title: string;
            description: string;
            price: number;
            city: string;
            area: string;
            address: string;
            latitude: number | null;
            longitude: number | null;
            bedrooms: number | null;
            bathrooms: number | null;
            areaSize: number | null;
            purpose: import(".prisma/client").$Enums.PropertyPurpose;
            status: import(".prisma/client").$Enums.PropertyStatus;
            categoryId: string;
            category: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
            ownerId: string;
            owner: ({
                id: string;
                name: string;
            } & {
                id: string;
                name: string;
                email?: string | null;
                phone?: string | null;
            }) | undefined;
            rejectionReason: string | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            images: {
                id: string;
                imageUrl: string | null;
                isPrimary: boolean;
                order: number;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    uploadVideo(id: string, user: AuthUser, file: Express.Multer.File): Promise<{
        message: string;
        property: {
            id: string;
            title: string;
            description: string;
            price: number;
            city: string;
            area: string;
            address: string;
            latitude: number | null;
            longitude: number | null;
            bedrooms: number | null;
            bathrooms: number | null;
            areaSize: number | null;
            purpose: import(".prisma/client").$Enums.PropertyPurpose;
            status: import(".prisma/client").$Enums.PropertyStatus;
            categoryId: string;
            category: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
            ownerId: string;
            owner: ({
                id: string;
                name: string;
            } & {
                id: string;
                name: string;
                email?: string | null;
                phone?: string | null;
            }) | undefined;
            rejectionReason: string | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            images: {
                id: string;
                imageUrl: string | null;
                isPrimary: boolean;
                order: number;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    removeVideo(id: string, user: AuthUser): Promise<{
        message: string;
        property: {
            id: string;
            title: string;
            description: string;
            price: number;
            city: string;
            area: string;
            address: string;
            latitude: number | null;
            longitude: number | null;
            bedrooms: number | null;
            bathrooms: number | null;
            areaSize: number | null;
            purpose: import(".prisma/client").$Enums.PropertyPurpose;
            status: import(".prisma/client").$Enums.PropertyStatus;
            categoryId: string;
            category: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
            ownerId: string;
            owner: ({
                id: string;
                name: string;
            } & {
                id: string;
                name: string;
                email?: string | null;
                phone?: string | null;
            }) | undefined;
            rejectionReason: string | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            images: {
                id: string;
                imageUrl: string | null;
                isPrimary: boolean;
                order: number;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    updateImage(id: string, imageId: string, user: AuthUser, dto: UpdatePropertyImageDto): Promise<{
        message: string;
        image: {
            id: string;
            imageUrl: string | null;
            isPrimary: boolean;
            order: number;
        };
    }>;
    removeImage(id: string, imageId: string, user: AuthUser): Promise<{
        message: string;
    }>;
    submit(id: string, user: AuthUser): Promise<{
        message: string;
        property: {
            id: string;
            title: string;
            description: string;
            price: number;
            city: string;
            area: string;
            address: string;
            latitude: number | null;
            longitude: number | null;
            bedrooms: number | null;
            bathrooms: number | null;
            areaSize: number | null;
            purpose: import(".prisma/client").$Enums.PropertyPurpose;
            status: import(".prisma/client").$Enums.PropertyStatus;
            categoryId: string;
            category: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
            ownerId: string;
            owner: ({
                id: string;
                name: string;
            } & {
                id: string;
                name: string;
                email?: string | null;
                phone?: string | null;
            }) | undefined;
            rejectionReason: string | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            images: {
                id: string;
                imageUrl: string | null;
                isPrimary: boolean;
                order: number;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    markSold(id: string, user: AuthUser): Promise<{
        message: string;
        property: {
            id: string;
            title: string;
            description: string;
            price: number;
            city: string;
            area: string;
            address: string;
            latitude: number | null;
            longitude: number | null;
            bedrooms: number | null;
            bathrooms: number | null;
            areaSize: number | null;
            purpose: import(".prisma/client").$Enums.PropertyPurpose;
            status: import(".prisma/client").$Enums.PropertyStatus;
            categoryId: string;
            category: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
            ownerId: string;
            owner: ({
                id: string;
                name: string;
            } & {
                id: string;
                name: string;
                email?: string | null;
                phone?: string | null;
            }) | undefined;
            rejectionReason: string | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            images: {
                id: string;
                imageUrl: string | null;
                isPrimary: boolean;
                order: number;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    markRented(id: string, user: AuthUser): Promise<{
        message: string;
        property: {
            id: string;
            title: string;
            description: string;
            price: number;
            city: string;
            area: string;
            address: string;
            latitude: number | null;
            longitude: number | null;
            bedrooms: number | null;
            bathrooms: number | null;
            areaSize: number | null;
            purpose: import(".prisma/client").$Enums.PropertyPurpose;
            status: import(".prisma/client").$Enums.PropertyStatus;
            categoryId: string;
            category: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
            ownerId: string;
            owner: ({
                id: string;
                name: string;
            } & {
                id: string;
                name: string;
                email?: string | null;
                phone?: string | null;
            }) | undefined;
            rejectionReason: string | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            images: {
                id: string;
                imageUrl: string | null;
                isPrimary: boolean;
                order: number;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}

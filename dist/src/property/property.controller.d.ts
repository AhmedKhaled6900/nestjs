import { AuthUser } from '../auth/interfaces/auth.interface';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyImageDto, UploadPropertyImagesDto } from './dto/property-image.dto';
import { QueryOwnerPropertyDto, QueryPropertyDto } from './dto/query-property.dto';
import { QuerySimilarPropertiesDto } from './dto/query-similar-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyImageService } from './property-image.service';
import { PropertyService } from './property.service';
export declare class PropertyController {
    private readonly propertyService;
    private readonly propertyImageService;
    constructor(propertyService: PropertyService, propertyImageService: PropertyImageService);
    findApproved(query: QueryPropertyDto, user?: AuthUser): Promise<import("../common/dto/pagination.dto").PaginatedResult<{
        id: string;
        title: string;
        description: string;
        price: number;
        pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
        parentCategoryId: string | null;
        parentCategory: {
            id: string;
            name: string;
            slug: string;
        } | null;
        subcategoryId: string;
        subcategory: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
        };
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
        suspensionReason: string | null;
        suspendedAt: Date | null;
        videoUrl: string | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        isNegotiable: boolean;
        attributes: {
            system: {
                id: string;
                attributeId: string | null;
                name: string;
                slug: string;
                type: import(".prisma/client").$Enums.AttributeType;
                value: import("@prisma/client/runtime/library").JsonValue;
            }[];
            custom: {
                id: string;
                name: string | null;
                type: import(".prisma/client").$Enums.AttributeType | null;
                value: import("@prisma/client/runtime/library").JsonValue;
            }[];
        };
        rental: {
            tenant?: {
                id: string;
                name: string;
                email: string | null;
                phone: string | null;
            } | undefined;
            id: string;
            source: import(".prisma/client").$Enums.RentalSource;
            agreedPrice: number;
            pricePeriod: string;
            duration: number;
            startedAt: Date;
            endsAt: Date;
            status: import(".prisma/client").$Enums.RentalStatus;
            notes: string | null;
            offerId: string | null;
        } | undefined;
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
        pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
        parentCategoryId: string | null;
        parentCategory: {
            id: string;
            name: string;
            slug: string;
        } | null;
        subcategoryId: string;
        subcategory: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
        };
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
        suspensionReason: string | null;
        suspendedAt: Date | null;
        videoUrl: string | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        isNegotiable: boolean;
        attributes: {
            system: {
                id: string;
                attributeId: string | null;
                name: string;
                slug: string;
                type: import(".prisma/client").$Enums.AttributeType;
                value: import("@prisma/client/runtime/library").JsonValue;
            }[];
            custom: {
                id: string;
                name: string | null;
                type: import(".prisma/client").$Enums.AttributeType | null;
                value: import("@prisma/client/runtime/library").JsonValue;
            }[];
        };
        rental: {
            tenant?: {
                id: string;
                name: string;
                email: string | null;
                phone: string | null;
            } | undefined;
            id: string;
            source: import(".prisma/client").$Enums.RentalSource;
            agreedPrice: number;
            pricePeriod: string;
            duration: number;
            startedAt: Date;
            endsAt: Date;
            status: import(".prisma/client").$Enums.RentalStatus;
            notes: string | null;
            offerId: string | null;
        } | undefined;
        images: {
            id: string;
            imageUrl: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>>;
    findSimilar(query: QuerySimilarPropertiesDto): Promise<{
        items: {
            id: string;
            title: string;
            description: string;
            price: number;
            pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
            parentCategoryId: string | null;
            parentCategory: {
                id: string;
                name: string;
                slug: string;
            } | null;
            subcategoryId: string;
            subcategory: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
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
            suspensionReason: string | null;
            suspendedAt: Date | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            isNegotiable: boolean;
            attributes: {
                system: {
                    id: string;
                    attributeId: string | null;
                    name: string;
                    slug: string;
                    type: import(".prisma/client").$Enums.AttributeType;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
                custom: {
                    id: string;
                    name: string | null;
                    type: import(".prisma/client").$Enums.AttributeType | null;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
            };
            rental: {
                tenant?: {
                    id: string;
                    name: string;
                    email: string | null;
                    phone: string | null;
                } | undefined;
                id: string;
                source: import(".prisma/client").$Enums.RentalSource;
                agreedPrice: number;
                pricePeriod: string;
                duration: number;
                startedAt: Date;
                endsAt: Date;
                status: import(".prisma/client").$Enums.RentalStatus;
                notes: string | null;
                offerId: string | null;
            } | undefined;
            images: {
                id: string;
                imageUrl: string | null;
                isPrimary: boolean;
                order: number;
            }[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: import("../common/dto/pagination.dto").PaginationMeta;
        criteria: {
            city: string;
            subcategoryId: string;
            bedrooms: {
                min: number;
                max: number;
            } | undefined;
            price: {
                min: number;
                max: number;
            };
            purpose: import(".prisma/client").$Enums.PropertyPurpose | null;
            excludePropertyId: string | null;
        };
    }>;
    findSimilarById(id: string, query: PaginationQueryDto, user?: AuthUser): Promise<{
        items: {
            id: string;
            title: string;
            description: string;
            price: number;
            pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
            parentCategoryId: string | null;
            parentCategory: {
                id: string;
                name: string;
                slug: string;
            } | null;
            subcategoryId: string;
            subcategory: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
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
            suspensionReason: string | null;
            suspendedAt: Date | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            isNegotiable: boolean;
            attributes: {
                system: {
                    id: string;
                    attributeId: string | null;
                    name: string;
                    slug: string;
                    type: import(".prisma/client").$Enums.AttributeType;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
                custom: {
                    id: string;
                    name: string | null;
                    type: import(".prisma/client").$Enums.AttributeType | null;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
            };
            rental: {
                tenant?: {
                    id: string;
                    name: string;
                    email: string | null;
                    phone: string | null;
                } | undefined;
                id: string;
                source: import(".prisma/client").$Enums.RentalSource;
                agreedPrice: number;
                pricePeriod: string;
                duration: number;
                startedAt: Date;
                endsAt: Date;
                status: import(".prisma/client").$Enums.RentalStatus;
                notes: string | null;
                offerId: string | null;
            } | undefined;
            images: {
                id: string;
                imageUrl: string | null;
                isPrimary: boolean;
                order: number;
            }[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: import("../common/dto/pagination.dto").PaginationMeta;
        criteria: {
            city: string;
            subcategoryId: string;
            bedrooms: {
                min: number;
                max: number;
            } | undefined;
            price: {
                min: number;
                max: number;
            };
            purpose: import(".prisma/client").$Enums.PropertyPurpose | null;
            excludePropertyId: string | null;
        };
    }>;
    findOne(id: string, user?: AuthUser): Promise<{
        id: string;
        title: string;
        description: string;
        price: number;
        pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
        parentCategoryId: string | null;
        parentCategory: {
            id: string;
            name: string;
            slug: string;
        } | null;
        subcategoryId: string;
        subcategory: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
        };
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
        suspensionReason: string | null;
        suspendedAt: Date | null;
        videoUrl: string | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        isNegotiable: boolean;
        attributes: {
            system: {
                id: string;
                attributeId: string | null;
                name: string;
                slug: string;
                type: import(".prisma/client").$Enums.AttributeType;
                value: import("@prisma/client/runtime/library").JsonValue;
            }[];
            custom: {
                id: string;
                name: string | null;
                type: import(".prisma/client").$Enums.AttributeType | null;
                value: import("@prisma/client/runtime/library").JsonValue;
            }[];
        };
        rental: {
            tenant?: {
                id: string;
                name: string;
                email: string | null;
                phone: string | null;
            } | undefined;
            id: string;
            source: import(".prisma/client").$Enums.RentalSource;
            agreedPrice: number;
            pricePeriod: string;
            duration: number;
            startedAt: Date;
            endsAt: Date;
            status: import(".prisma/client").$Enums.RentalStatus;
            notes: string | null;
            offerId: string | null;
        } | undefined;
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
        pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
        parentCategoryId: string | null;
        parentCategory: {
            id: string;
            name: string;
            slug: string;
        } | null;
        subcategoryId: string;
        subcategory: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
        };
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
        suspensionReason: string | null;
        suspendedAt: Date | null;
        videoUrl: string | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        isNegotiable: boolean;
        attributes: {
            system: {
                id: string;
                attributeId: string | null;
                name: string;
                slug: string;
                type: import(".prisma/client").$Enums.AttributeType;
                value: import("@prisma/client/runtime/library").JsonValue;
            }[];
            custom: {
                id: string;
                name: string | null;
                type: import(".prisma/client").$Enums.AttributeType | null;
                value: import("@prisma/client/runtime/library").JsonValue;
            }[];
        };
        rental: {
            tenant?: {
                id: string;
                name: string;
                email: string | null;
                phone: string | null;
            } | undefined;
            id: string;
            source: import(".prisma/client").$Enums.RentalSource;
            agreedPrice: number;
            pricePeriod: string;
            duration: number;
            startedAt: Date;
            endsAt: Date;
            status: import(".prisma/client").$Enums.RentalStatus;
            notes: string | null;
            offerId: string | null;
        } | undefined;
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
        pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
        parentCategoryId: string | null;
        parentCategory: {
            id: string;
            name: string;
            slug: string;
        } | null;
        subcategoryId: string;
        subcategory: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
        };
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
        suspensionReason: string | null;
        suspendedAt: Date | null;
        videoUrl: string | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
        isNegotiable: boolean;
        attributes: {
            system: {
                id: string;
                attributeId: string | null;
                name: string;
                slug: string;
                type: import(".prisma/client").$Enums.AttributeType;
                value: import("@prisma/client/runtime/library").JsonValue;
            }[];
            custom: {
                id: string;
                name: string | null;
                type: import(".prisma/client").$Enums.AttributeType | null;
                value: import("@prisma/client/runtime/library").JsonValue;
            }[];
        };
        rental: {
            tenant?: {
                id: string;
                name: string;
                email: string | null;
                phone: string | null;
            } | undefined;
            id: string;
            source: import(".prisma/client").$Enums.RentalSource;
            agreedPrice: number;
            pricePeriod: string;
            duration: number;
            startedAt: Date;
            endsAt: Date;
            status: import(".prisma/client").$Enums.RentalStatus;
            notes: string | null;
            offerId: string | null;
        } | undefined;
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
            pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
            parentCategoryId: string | null;
            parentCategory: {
                id: string;
                name: string;
                slug: string;
            } | null;
            subcategoryId: string;
            subcategory: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
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
            suspensionReason: string | null;
            suspendedAt: Date | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            isNegotiable: boolean;
            attributes: {
                system: {
                    id: string;
                    attributeId: string | null;
                    name: string;
                    slug: string;
                    type: import(".prisma/client").$Enums.AttributeType;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
                custom: {
                    id: string;
                    name: string | null;
                    type: import(".prisma/client").$Enums.AttributeType | null;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
            };
            rental: {
                tenant?: {
                    id: string;
                    name: string;
                    email: string | null;
                    phone: string | null;
                } | undefined;
                id: string;
                source: import(".prisma/client").$Enums.RentalSource;
                agreedPrice: number;
                pricePeriod: string;
                duration: number;
                startedAt: Date;
                endsAt: Date;
                status: import(".prisma/client").$Enums.RentalStatus;
                notes: string | null;
                offerId: string | null;
            } | undefined;
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
            pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
            parentCategoryId: string | null;
            parentCategory: {
                id: string;
                name: string;
                slug: string;
            } | null;
            subcategoryId: string;
            subcategory: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
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
            suspensionReason: string | null;
            suspendedAt: Date | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            isNegotiable: boolean;
            attributes: {
                system: {
                    id: string;
                    attributeId: string | null;
                    name: string;
                    slug: string;
                    type: import(".prisma/client").$Enums.AttributeType;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
                custom: {
                    id: string;
                    name: string | null;
                    type: import(".prisma/client").$Enums.AttributeType | null;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
            };
            rental: {
                tenant?: {
                    id: string;
                    name: string;
                    email: string | null;
                    phone: string | null;
                } | undefined;
                id: string;
                source: import(".prisma/client").$Enums.RentalSource;
                agreedPrice: number;
                pricePeriod: string;
                duration: number;
                startedAt: Date;
                endsAt: Date;
                status: import(".prisma/client").$Enums.RentalStatus;
                notes: string | null;
                offerId: string | null;
            } | undefined;
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
            pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
            parentCategoryId: string | null;
            parentCategory: {
                id: string;
                name: string;
                slug: string;
            } | null;
            subcategoryId: string;
            subcategory: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
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
            suspensionReason: string | null;
            suspendedAt: Date | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            isNegotiable: boolean;
            attributes: {
                system: {
                    id: string;
                    attributeId: string | null;
                    name: string;
                    slug: string;
                    type: import(".prisma/client").$Enums.AttributeType;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
                custom: {
                    id: string;
                    name: string | null;
                    type: import(".prisma/client").$Enums.AttributeType | null;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
            };
            rental: {
                tenant?: {
                    id: string;
                    name: string;
                    email: string | null;
                    phone: string | null;
                } | undefined;
                id: string;
                source: import(".prisma/client").$Enums.RentalSource;
                agreedPrice: number;
                pricePeriod: string;
                duration: number;
                startedAt: Date;
                endsAt: Date;
                status: import(".prisma/client").$Enums.RentalStatus;
                notes: string | null;
                offerId: string | null;
            } | undefined;
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
            pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
            parentCategoryId: string | null;
            parentCategory: {
                id: string;
                name: string;
                slug: string;
            } | null;
            subcategoryId: string;
            subcategory: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
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
            suspensionReason: string | null;
            suspendedAt: Date | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            isNegotiable: boolean;
            attributes: {
                system: {
                    id: string;
                    attributeId: string | null;
                    name: string;
                    slug: string;
                    type: import(".prisma/client").$Enums.AttributeType;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
                custom: {
                    id: string;
                    name: string | null;
                    type: import(".prisma/client").$Enums.AttributeType | null;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
            };
            rental: {
                tenant?: {
                    id: string;
                    name: string;
                    email: string | null;
                    phone: string | null;
                } | undefined;
                id: string;
                source: import(".prisma/client").$Enums.RentalSource;
                agreedPrice: number;
                pricePeriod: string;
                duration: number;
                startedAt: Date;
                endsAt: Date;
                status: import(".prisma/client").$Enums.RentalStatus;
                notes: string | null;
                offerId: string | null;
            } | undefined;
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
            pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
            parentCategoryId: string | null;
            parentCategory: {
                id: string;
                name: string;
                slug: string;
            } | null;
            subcategoryId: string;
            subcategory: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
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
            suspensionReason: string | null;
            suspendedAt: Date | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            isNegotiable: boolean;
            attributes: {
                system: {
                    id: string;
                    attributeId: string | null;
                    name: string;
                    slug: string;
                    type: import(".prisma/client").$Enums.AttributeType;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
                custom: {
                    id: string;
                    name: string | null;
                    type: import(".prisma/client").$Enums.AttributeType | null;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
            };
            rental: {
                tenant?: {
                    id: string;
                    name: string;
                    email: string | null;
                    phone: string | null;
                } | undefined;
                id: string;
                source: import(".prisma/client").$Enums.RentalSource;
                agreedPrice: number;
                pricePeriod: string;
                duration: number;
                startedAt: Date;
                endsAt: Date;
                status: import(".prisma/client").$Enums.RentalStatus;
                notes: string | null;
                offerId: string | null;
            } | undefined;
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
            pricePeriod: import(".prisma/client").$Enums.PricePeriod | null;
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
            parentCategoryId: string | null;
            parentCategory: {
                id: string;
                name: string;
                slug: string;
            } | null;
            subcategoryId: string;
            subcategory: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
            };
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
            suspensionReason: string | null;
            suspendedAt: Date | null;
            videoUrl: string | null;
            submittedAt: Date | null;
            approvedAt: Date | null;
            isNegotiable: boolean;
            attributes: {
                system: {
                    id: string;
                    attributeId: string | null;
                    name: string;
                    slug: string;
                    type: import(".prisma/client").$Enums.AttributeType;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
                custom: {
                    id: string;
                    name: string | null;
                    type: import(".prisma/client").$Enums.AttributeType | null;
                    value: import("@prisma/client/runtime/library").JsonValue;
                }[];
            };
            rental: {
                tenant?: {
                    id: string;
                    name: string;
                    email: string | null;
                    phone: string | null;
                } | undefined;
                id: string;
                source: import(".prisma/client").$Enums.RentalSource;
                agreedPrice: number;
                pricePeriod: string;
                duration: number;
                startedAt: Date;
                endsAt: Date;
                status: import(".prisma/client").$Enums.RentalStatus;
                notes: string | null;
                offerId: string | null;
            } | undefined;
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

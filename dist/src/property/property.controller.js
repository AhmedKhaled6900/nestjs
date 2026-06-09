"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const upload_constants_1 = require("../upload/upload.constants");
const create_property_dto_1 = require("./dto/create-property.dto");
const property_image_dto_1 = require("./dto/property-image.dto");
const query_property_dto_1 = require("./dto/query-property.dto");
const update_property_dto_1 = require("./dto/update-property.dto");
const property_image_service_1 = require("./property-image.service");
const property_service_1 = require("./property.service");
const propertyImagesInterceptor = (0, platform_express_1.FilesInterceptor)('images', upload_constants_1.MAX_PROPERTY_IMAGES, {
    storage: (0, multer_1.memoryStorage)(),
    limits: { fileSize: upload_constants_1.MAX_PROPERTY_IMAGE_SIZE_BYTES },
});
let PropertyController = class PropertyController {
    constructor(propertyService, propertyImageService) {
        this.propertyService = propertyService;
        this.propertyImageService = propertyImageService;
    }
    findApproved(query) {
        return this.propertyService.findApproved(query);
    }
    findMine(user, query) {
        return this.propertyService.findMine(user.id, query);
    }
    findOne(id) {
        return this.propertyService.findById(id);
    }
    create(user, dto) {
        return this.propertyService.create(user.id, dto);
    }
    update(id, user, dto) {
        return this.propertyService.update(id, user.id, dto);
    }
    remove(id, user) {
        return this.propertyService.remove(id, user.id);
    }
    uploadImages(id, user, files, dto) {
        return this.propertyImageService.uploadImages(id, user.id, files ?? [], dto.primaryIndex ?? 0);
    }
    updateImage(id, imageId, user, dto) {
        return this.propertyImageService.updateImage(id, imageId, user.id, dto);
    }
    removeImage(id, imageId, user) {
        return this.propertyImageService.removeImage(id, imageId, user.id);
    }
    submit(id, user) {
        return this.propertyService.submitForReview(id, user.id);
    }
    markSold(id, user) {
        return this.propertyService.markSold(id, user.id);
    }
    markRented(id, user) {
        return this.propertyService.markRented(id, user.id);
    }
};
exports.PropertyController = PropertyController;
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List approved properties (public catalog)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_property_dto_1.QueryPropertyDto]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "findApproved", null);
__decorate([
    (0, common_1.Get)('my/list'),
    (0, permissions_decorator_1.RequirePermissions)('property.read'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'List my properties (owner)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_property_dto_1.QueryOwnerPropertyDto]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "findMine", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get property details (approved only for public)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'uuid-here' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('property.create'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Create property as DRAFT (verified owner)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Property created' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_property_dto_1.CreatePropertyDto]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('property.update'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update property (DRAFT or REJECTED only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_property_dto_1.UpdatePropertyDto]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('property.delete'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete property (DRAFT or REJECTED only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/images'),
    (0, permissions_decorator_1.RequirePermissions)('property.update'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseInterceptors)(propertyImagesInterceptor),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ type: property_image_dto_1.UploadPropertyImagesDto }),
    (0, swagger_1.ApiOperation)({ summary: 'Upload property images' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Array, property_image_dto_1.UploadPropertyImagesDto]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "uploadImages", null);
__decorate([
    (0, common_1.Patch)(':id/images/:imageId'),
    (0, permissions_decorator_1.RequirePermissions)('property.update'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update image order or primary flag' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('imageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, property_image_dto_1.UpdatePropertyImageDto]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "updateImage", null);
__decorate([
    (0, common_1.Delete)(':id/images/:imageId'),
    (0, permissions_decorator_1.RequirePermissions)('property.update'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete property image' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('imageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "removeImage", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, permissions_decorator_1.RequirePermissions)('property.publish'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit property for admin review (→ PENDING)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "submit", null);
__decorate([
    (0, common_1.Patch)(':id/mark-sold'),
    (0, permissions_decorator_1.RequirePermissions)('property.update'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark approved SALE property as SOLD' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "markSold", null);
__decorate([
    (0, common_1.Patch)(':id/mark-rented'),
    (0, permissions_decorator_1.RequirePermissions)('property.update'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark approved RENT property as RENTED' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "markRented", null);
exports.PropertyController = PropertyController = __decorate([
    (0, swagger_1.ApiTags)('Properties'),
    (0, common_1.Controller)('properties'),
    __metadata("design:paramtypes", [property_service_1.PropertyService,
        property_image_service_1.PropertyImageService])
], PropertyController);
//# sourceMappingURL=property.controller.js.map
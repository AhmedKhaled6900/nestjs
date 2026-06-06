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
exports.BookingController = exports.PropertyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
let PropertyController = class PropertyController {
    findAll(user) {
        return {
            message: 'Published properties visible to authenticated users with property.read',
            requestedBy: { id: user.id, role: user.role },
        };
    }
    create(body, user) {
        return {
            message: 'Property created',
            ownerId: user.id,
            data: body,
        };
    }
    update(id, body, user) {
        return {
            message: `Property ${id} updated by owner`,
            ownerId: user.id,
            data: body,
        };
    }
    publish(id, user) {
        return {
            message: `Property ${id} published`,
            publishedBy: user.id,
        };
    }
    remove(id, user) {
        return {
            message: `Property ${id} deleted`,
            deletedBy: user.id,
        };
    }
    adminListAll(user) {
        return {
            message: 'Admin-only: all properties including drafts',
            adminId: user.id,
        };
    }
};
exports.PropertyController = PropertyController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)('property.read'),
    (0, swagger_1.ApiOperation)({ summary: 'List published properties', description: 'Permission: `property.read`' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of properties' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Missing property.read permission' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('property.create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create property', description: 'Permission: `property.create` (Owner/Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Property created' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Missing property.create permission' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('property.update'),
    (0, swagger_1.ApiOperation)({ summary: 'Update property', description: 'Permission: `property.update`' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'uuid-here' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Property updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, permissions_decorator_1.RequirePermissions)('property.publish'),
    (0, swagger_1.ApiOperation)({ summary: 'Publish property', description: 'Permission: `property.publish`' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'uuid-here' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Property published' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "publish", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('property.delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete property', description: 'Permission: `property.delete`' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'uuid-here' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Property deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, permissions_decorator_1.RequireRoles)('ADMIN'),
    (0, permissions_decorator_1.RequirePermissions)('property.read'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: list all properties', description: 'Role: ADMIN + Permission: `property.read`' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All properties including drafts' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin role required' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PropertyController.prototype, "adminListAll", null);
exports.PropertyController = PropertyController = __decorate([
    (0, swagger_1.ApiTags)('Properties'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('properties')
], PropertyController);
let BookingController = class BookingController {
    create(body, user) {
        return {
            message: 'Booking created',
            customerId: user.id,
            data: body,
        };
    }
    myBookings(user) {
        return {
            message: 'Your bookings',
            userId: user.id,
        };
    }
    cancel(id, user) {
        return {
            message: `Booking ${id} cancelled`,
            cancelledBy: user.id,
        };
    }
};
exports.BookingController = BookingController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('booking.create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create booking', description: 'Permission: `booking.create` (Customer)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Booking created' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BookingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, permissions_decorator_1.RequirePermissions)('booking.read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my bookings', description: 'Permission: `booking.read`' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User bookings list' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BookingController.prototype, "myBookings", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)('booking.cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel booking', description: 'Permission: `booking.cancel`' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'uuid-here' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Booking cancelled' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BookingController.prototype, "cancel", null);
exports.BookingController = BookingController = __decorate([
    (0, swagger_1.ApiTags)('Bookings'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('bookings')
], BookingController);
//# sourceMappingURL=property.controller.js.map
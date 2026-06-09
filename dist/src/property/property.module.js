"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyModule = void 0;
const common_1 = require("@nestjs/common");
const category_module_1 = require("../category/category.module");
const upload_module_1 = require("../upload/upload.module");
const admin_property_controller_1 = require("./admin-property.controller");
const booking_controller_1 = require("./booking.controller");
const property_image_service_1 = require("./property-image.service");
const property_controller_1 = require("./property.controller");
const property_service_1 = require("./property.service");
let PropertyModule = class PropertyModule {
};
exports.PropertyModule = PropertyModule;
exports.PropertyModule = PropertyModule = __decorate([
    (0, common_1.Module)({
        imports: [category_module_1.CategoryModule, upload_module_1.UploadModule],
        controllers: [
            property_controller_1.PropertyController,
            admin_property_controller_1.AdminPropertyController,
            booking_controller_1.BookingController,
        ],
        providers: [property_service_1.PropertyService, property_image_service_1.PropertyImageService],
        exports: [property_service_1.PropertyService],
    })
], PropertyModule);
//# sourceMappingURL=property.module.js.map
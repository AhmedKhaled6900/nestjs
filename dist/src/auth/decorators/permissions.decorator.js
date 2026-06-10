"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireRoles = exports.ROLES_KEY = exports.RequirePermissions = exports.PERMISSIONS_KEY = exports.OptionalAuth = exports.OPTIONAL_AUTH_KEY = exports.Public = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
exports.OPTIONAL_AUTH_KEY = 'optionalAuth';
const OptionalAuth = () => (0, common_1.SetMetadata)(exports.OPTIONAL_AUTH_KEY, true);
exports.OptionalAuth = OptionalAuth;
exports.PERMISSIONS_KEY = 'permissions';
const RequirePermissions = (...permissions) => (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, permissions);
exports.RequirePermissions = RequirePermissions;
exports.ROLES_KEY = 'roles';
const RequireRoles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.RequireRoles = RequireRoles;
//# sourceMappingURL=permissions.decorator.js.map
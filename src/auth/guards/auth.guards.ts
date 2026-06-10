import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, OPTIONAL_AUTH_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic && !isOptionalAuth) {
      return true;
    }

    if (isOptionalAuth) {
      const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
      if (!request.headers?.authorization?.startsWith('Bearer ')) {
        return true;
      }
    }

    return super.canActivate(context);
  }

  handleRequest<T>(
    err: Error | null,
    user: T,
    _info: unknown,
    context: ExecutionContext,
  ): T {
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isOptionalAuth && (err || !user)) {
      return undefined as T;
    }

    if (err || !user) {
      throw err ?? new UnauthorizedException('Authentication required');
    }
    return user;
  }
}

@Injectable()
export class PermissionsGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { permissions: string[] } }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const hasAll = requiredPermissions.every((p) =>
      user.permissions.includes(p),
    );

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

@Injectable()
export class RolesGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { role: string } }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}

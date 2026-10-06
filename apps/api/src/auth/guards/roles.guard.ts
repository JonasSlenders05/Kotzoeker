import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@kotzoeker/shared";
import type { Session } from "../auth.types";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const user = context.switchToHttp().getRequest<{ user?: Session }>().user;
    if (!user) throw new UnauthorizedException("Je moet ingelogd zijn.");
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Je hebt geen toegang tot deze actie.");
    }
    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";

import { IRoleModel } from "@models/index";
import { Role } from "@constants/roles.constants";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: Logger,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const requiredRoles = this.reflector.get<Array<Role>>(
        "roles",
        context.getHandler(),
      );

      if (!requiredRoles.length) {
        return true;
      }

      const request = context.switchToHttp().getRequest();

      return this.matchRoles(requiredRoles, request.user.roles);
    } catch (error) {
      this.logger.error({ error: error.message }, "Failed to auth by roles");
      throw new Error(error);
    }
  }

  private matchRoles(
    requiredRoles: Array<Role>,
    userRoles: Array<IRoleModel>,
  ): boolean {
    return requiredRoles.some((requiredRole) =>
      userRoles.some((userRole) => {
        return requiredRole === userRole.value;
      }),
    );
  }
}

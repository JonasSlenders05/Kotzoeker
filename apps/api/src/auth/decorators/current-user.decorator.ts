import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Session } from "../auth.types";

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Session =>
    ctx.switchToHttp().getRequest().user,
);

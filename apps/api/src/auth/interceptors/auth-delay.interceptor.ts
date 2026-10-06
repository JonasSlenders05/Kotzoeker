import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timer } from "rxjs";
import { switchMap } from "rxjs/operators";
import type { Env } from "../../config/env";

@Injectable()
export class AuthDelayInterceptor implements NestInterceptor {
  constructor(private readonly config: ConfigService<Env, true>) {}

  intercept(_: ExecutionContext, next: CallHandler) {
    const maxDelay = this.config.get("AUTH_MAX_DELAY", { infer: true });
    return timer(Math.round(Math.random() * maxDelay)).pipe(
      switchMap(() => next.handle()),
    );
  }
}

import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";
import { validateEnv, type Env } from "./config/env";
import { DrizzleModule } from "./drizzle/drizzle.module";
import { HealthController } from "./health/health.controller";
import { LoggerMiddleware } from "./lib/logger.middleware";
import { ZodValidationPipe } from "./lib/zod-validation.pipe";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    DrizzleModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule implements NestModule {
  constructor(private readonly config: ConfigService<Env, true>) {}

  configure(consumer: MiddlewareConsumer) {
    if (!this.config.get("LOG_DISABLED", { infer: true })) {
      consumer.apply(LoggerMiddleware).forRoutes("{*splat}");
    }
  }
}

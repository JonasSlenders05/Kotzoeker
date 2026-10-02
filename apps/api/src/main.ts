import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import type { Env } from "./config/env";
import { setupApp } from "./setup-app";

async function bootstrap() {
  const app = setupApp(await NestFactory.create(AppModule));
  const port = app
    .get<ConfigService<Env, true>>(ConfigService)
    .get("PORT", { infer: true });
  await app.listen(port);
  Logger.log(
    `API op http://localhost:${port}/api, docs op http://localhost:${port}/docs`,
    "Bootstrap",
  );
}

void bootstrap();

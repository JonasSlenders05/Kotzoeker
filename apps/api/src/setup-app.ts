import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { DrizzleQueryErrorFilter } from "./drizzle/drizzle-query-error.filter";
import { ApiExceptionFilter } from "./lib/api-exception.filter";

export function setupApp(app: INestApplication) {
  app.setGlobalPrefix("api");
  app.use(helmet());
  app.enableShutdownHooks();
  app.useGlobalFilters(new ApiExceptionFilter(), new DrizzleQueryErrorFilter());

  const config = new DocumentBuilder()
    .setTitle("Kotzoeker API")
    .setDescription(
      "REST API voor kotbazen en studenten. Inloggen via POST /api/sessions, daarna `Authorization: Bearer <token>`.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, cleanupOpenApiDoc(document));

  return app;
}

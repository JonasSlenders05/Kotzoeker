import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { sql } from "drizzle-orm";
import { Public } from "../auth/decorators/public.decorator";
import {
  InjectDrizzle,
  type DatabaseProvider,
} from "../drizzle/drizzle.provider";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(@InjectDrizzle() private readonly db: DatabaseProvider) {}

  @Get()
  @Public()
  async check() {
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      throw new ServiceUnavailableException("De database is niet bereikbaar.");
    }
    return { ok: true, ts: new Date().toISOString() };
  }
}

import { Global, Module, OnApplicationShutdown } from "@nestjs/common";
import {
  DRIZZLE,
  drizzleProvider,
  InjectDrizzle,
  type DatabaseProvider,
} from "./drizzle.provider";

@Global()
@Module({
  providers: [drizzleProvider],
  exports: [DRIZZLE],
})
export class DrizzleModule implements OnApplicationShutdown {
  constructor(@InjectDrizzle() private readonly db: DatabaseProvider) {}

  async onApplicationShutdown() {
    await this.db.$client.end();
  }
}

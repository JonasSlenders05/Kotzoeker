import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import type { Env } from "../config/env";
import { AuthService } from "./auth.service";

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get("AUTH_JWT_SECRET", { infer: true }),
        signOptions: {
          algorithm: "HS256",
          expiresIn: config.get("AUTH_JWT_EXPIRATION_INTERVAL", {
            infer: true,
          }),
          audience: config.get("AUTH_JWT_AUDIENCE", { infer: true }),
          issuer: config.get("AUTH_JWT_ISSUER", { infer: true }),
        },
        verifyOptions: {
          algorithms: ["HS256"],
          audience: config.get("AUTH_JWT_AUDIENCE", { infer: true }),
          issuer: config.get("AUTH_JWT_ISSUER", { infer: true }),
        },
      }),
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

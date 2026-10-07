// apps/api/src/session/session.controller.ts
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseInterceptors,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "../auth/auth.service";
import { Public } from "../auth/decorators/public.decorator";
import { AuthDelayInterceptor } from "../auth/interceptors/auth-delay.interceptor";
import { LoginRequestDto, TokenResponseDto } from "./session.dto";

@ApiTags("Sessions")
@Controller("sessions")
export class SessionController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @Public()
  @UseInterceptors(AuthDelayInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, type: TokenResponseDto })
  @ApiResponse({
    status: 401,
    description: "E-mailadres of wachtwoord klopt niet",
  })
  async login(@Body() dto: LoginRequestDto): Promise<TokenResponseDto> {
    return { token: await this.authService.login(dto) };
  }
}

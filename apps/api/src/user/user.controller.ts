// apps/api/src/user/user.controller.ts
import { Body, Controller, Get, Post, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { CurrentUserDto } from "@kotzoeker/shared";
import { AuthService } from "../auth/auth.service";
import type { Session } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { AuthDelayInterceptor } from "../auth/interceptors/auth-delay.interceptor";
import { TokenResponseDto } from "../session/session.dto";
import { RegisterUserRequestDto } from "./user.dto";
import { UserService } from "./user.service";

@ApiTags("Users")
@Controller("users")
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post()
  @Public()
  @UseInterceptors(AuthDelayInterceptor)
  @ApiResponse({ status: 201, type: TokenResponseDto })
  @ApiResponse({
    status: 409,
    description: "Er bestaat al een account met dit e-mailadres",
  })
  async register(
    @Body() dto: RegisterUserRequestDto,
  ): Promise<TokenResponseDto> {
    return { token: await this.authService.register(dto) };
  }

  @Get("me")
  @ApiBearerAuth()
  async me(@CurrentUser() user: Session): Promise<CurrentUserDto> {
    return this.userService.getById(user.id);
  }
}

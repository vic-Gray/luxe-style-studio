import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "../services/auth.service";
import { LoginAdminDto } from "../dto/login-admin.dto";
import { Public } from "../../common/decorators";

/**
 * AuthController - Handles authentication endpoints for admin users
 * Base path: /auth
 */
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Admin login endpoint
   * @param loginDto - Login credentials (email + password)
   * @returns JWT access token and admin user info
   */
  @Public()
  @Post("admin/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Admin login",
    description: "Authenticate admin user and receive JWT token",
  })
  @ApiResponse({
    status: 200,
    description: "Login successful, returns JWT token",
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginAdminDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Admin registration endpoint (for initial setup)
   * @param loginDto - Registration data (email + password)
   * @returns JWT access token and admin user info
   */
  @Public()
  @Post("admin/register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Admin registration",
    description: "Register new admin user (use only for initial setup)",
  })
  @ApiResponse({
    status: 201,
    description: "Registration successful, returns JWT token",
  })
  @ApiResponse({
    status: 409,
    description: "Admin with this email already exists",
  })
  async register(@Body() loginDto: LoginAdminDto) {
    return this.authService.register(loginDto);
  }
}

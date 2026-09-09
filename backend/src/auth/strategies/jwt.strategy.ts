import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../services/auth.service";
import { JwtPayload } from "../../common/interfaces";

/**
 * JWT Strategy for Passport authentication
 * Validates JWT tokens and extracts user information
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>("JWT_SECRET") ||
        "default-secret-change-in-production",
    });
  }

  /**
   * Validate JWT payload and return user data
   * @param payload - Decoded JWT token payload
   * @returns User object if valid
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const admin = await this.authService.validateToken(payload);

    if (!admin) {
      throw new UnauthorizedException("Invalid token or admin not found");
    }

    return payload;
  }
}

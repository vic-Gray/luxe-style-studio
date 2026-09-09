import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { Admin } from "../entities/admin.entity";
import { LoginAdminDto } from "../dto/login-admin.dto";
import { AuthResponse, JwtPayload, UserRole } from "../../common/interfaces";

/**
 * AuthService - Handles authentication logic for admin users
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    private jwtService: JwtService,
  ) {}

  /**
   * Authenticate admin user with email and password
   * @param loginDto - Login credentials
   * @returns AuthResponse with JWT token
   */
  async login(loginDto: LoginAdminDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find admin by email
    const admin = await this.adminModel.findOne({ email });
    if (!admin) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Check if admin is active
    if (!admin.isActive) {
      throw new UnauthorizedException("This account has been deactivated");
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: admin._id.toString(),
      email: admin.email,
      role: UserRole.ADMIN,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: admin._id.toString(),
        email: admin.email,
        role: UserRole.ADMIN,
      },
    };
  }

  /**
   * Register a new admin user (for initial setup)
   * @param loginDto - Registration data
   * @returns AuthResponse with JWT token
   */
  async register(loginDto: LoginAdminDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Check if admin already exists
    const existingAdmin = await this.adminModel.findOne({ email });
    if (existingAdmin) {
      throw new ConflictException("An admin with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = new this.adminModel({
      email,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    await admin.save();

    // Generate JWT token
    const payload: JwtPayload = {
      sub: admin._id.toString(),
      email: admin.email,
      role: UserRole.ADMIN,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: admin._id.toString(),
        email: admin.email,
        role: UserRole.ADMIN,
      },
    };
  }

  /**
   * Validate JWT token payload
   * @param payload - JWT payload
   * @returns Admin user if valid
   */
  async validateToken(payload: JwtPayload): Promise<Admin | null> {
    const admin = await this.adminModel.findById(payload.sub);
    return admin && admin.isActive ? admin : null;
  }
}

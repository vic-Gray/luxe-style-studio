import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for admin login
 */
export class LoginAdminDto {
  @ApiProperty({
    example: "admin@luxestyle.com",
    description: "Admin email address",
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  email: string;

  @ApiProperty({ example: "SecureP@ss123", description: "Admin password" })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @MaxLength(50, { message: "Password must not exceed 50 characters" })
  password: string;
}

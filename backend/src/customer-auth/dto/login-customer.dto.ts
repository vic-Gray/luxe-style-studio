import { IsString, IsNotEmpty, IsEmail, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginCustomerDto {
  @ApiProperty({
    example: "customer@example.com",
    description: "Customer email",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "password123", description: "Customer password" })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;
}

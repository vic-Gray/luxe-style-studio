import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  MinLength,
  IsUrl,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";

/**
 * DTO for creating a new item
 */
export class CreateItemDto {
  @ApiProperty({ example: "Designer Silk Dress", description: "Item name" })
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters long" })
  @MaxLength(100, { message: "Name must not exceed 100 characters" })
  name?: string;

  @ApiProperty({
    example: "Luxurious silk dress perfect for evening occasions",
    description: "Item description",
  })
  @IsString()
  @MinLength(10, { message: "Description must be at least 10 characters long" })
  @MaxLength(2000, { message: "Description must not exceed 2000 characters" })
  description?: string;

  @ApiProperty({ example: 299.99, description: "Item price in USD" })
  @IsNumber()
  @Min(0, { message: "Price must be a positive number" })
  price?: number;

  @ApiProperty({ example: "Dresses", description: "Item category" })
  @IsString()
  @MinLength(2, { message: "Category must be at least 2 characters long" })
  @MaxLength(50, { message: "Category must not exceed 50 characters" })
  @IsOptional()
  category?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({}, { message: "Please provide a valid image URL" })
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string | null;

  @ApiPropertyOptional({
    example: 10,
    description: "Stock quantity",
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size?: string;
}

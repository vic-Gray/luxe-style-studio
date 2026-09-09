import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsMongoId,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProductVariantDto {
  @ApiProperty({
    example: "507f1f77bcf86cd799439011",
    description: "Product ID",
  })
  @IsString()
  @IsMongoId()
  productId: string;

  @ApiPropertyOptional({ example: "Black", description: "Color variant" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: "M", description: "Size variant" })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({
    example: "https://res.cloudinary.com/...",
    description: "Cloudinary image URL",
  })
  @IsString()
  image: string;

  @ApiPropertyOptional({
    example: 10,
    description: "Stock quantity",
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number = 0;

  @ApiProperty({ example: 99.99, description: "Variant price" })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: "SKU-123", description: "SKU code" })
  @IsOptional()
  @IsString()
  sku?: string;
}

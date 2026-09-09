import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for the optional customer geolocation payload.
 *
 * This is validated loosely so that an invalid/partial location never
 * blocks the whole order: the service layer calls validateLocation() and
 * silently drops to null on any constraint violation.
 *
 * All three fields are optional at the DTO level because the client may
 * omit accuracy (older bundle) or send partial data.
 */
export class LocationDto {
  @ApiPropertyOptional({ description: "Latitude (-90 to 90)", example: 6.5244 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({
    description: "Longitude (-180 to 180)",
    example: 3.3792,
  })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({
    description: "GPS accuracy in metres (≥ 0)",
    example: 35,
  })
  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  itemId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: "Size e.g. S, M, L, XL, XXL" })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiPropertyOptional({ description: "Currency code", default: "NGN" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleMapsLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Optional customer geolocation.
   *
   * The client may send `location: null` (user declined), omit the field
   * entirely (old bundle / API consumer), or send a full `{lat, lng, accuracy}`
   * object. All three cases are valid at the DTO level. The service layer runs
   * validateLocation() and drops the value to null if coordinates are
   * out of range or the wrong type — the order is NEVER rejected because of
   * a bad location.
   */
  @ApiPropertyOptional({
    type: () => LocationDto,
    nullable: true,
    description: "Optional customer geolocation captured at checkout time",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto | null;
}

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({
    enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
  })
  @IsOptional()
  @IsEnum(["pending", "paid", "shipped", "delivered", "cancelled"])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paystackReference?: string;
}

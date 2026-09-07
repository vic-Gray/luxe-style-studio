import { IsString, IsNumber, IsOptional, Min, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePaymentDto {
  @ApiProperty({ description: "Order ID" })
  @IsString()
  orderId: string;

  @ApiProperty({ description: "Payment amount", minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: "Currency code", default: "NGN" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: "Payment method", default: "manual" })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ description: "Transaction ID" })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: "Payment notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: ["pending", "completed", "failed", "refunded"] })
  @IsEnum(["pending", "completed", "failed", "refunded"])
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class InitializePaymentDto {
  @ApiProperty({ description: "Order ID to initialize payment for" })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

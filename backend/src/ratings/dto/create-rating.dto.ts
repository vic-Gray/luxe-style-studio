import { IsInt, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRatingDto {
  @ApiProperty({ example: 5, description: "Rating value (1-5)" })
  @IsInt()
  @Min(1)
  @Max(5)
  value: number;
}

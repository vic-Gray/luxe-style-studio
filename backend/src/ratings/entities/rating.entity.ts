import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Rating extends Document {
  @Prop({ required: true })
  userId: string; // Reference to User

  @Prop({ required: true })
  itemId: string; // Reference to Item

  @Prop({ required: true, min: 1, max: 5 })
  value: number; // Rating value (1-5)
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

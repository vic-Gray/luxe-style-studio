import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Item extends Document {
  @Prop({ required: true })
  name?: string;

  @Prop({ required: true })
  description?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: false, default: null })
  category?: string | null;

  @Prop({ required: true })
  imageUrl!: string;

  @Prop({ default: true })
  isActive?: boolean;

  @Prop({ default: true })
  size!: string;

  @Prop({ default: true })
  color!: string | null;

  @Prop({ type: Types.ObjectId })
  stock!: number;

  @Prop({ type: Types.ObjectId, ref: "User", nullable: true })
  createdBy?: Types.ObjectId;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

// Create text index for search functionality
ItemSchema.index({ name: "text", description: "text" });

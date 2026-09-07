import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class ProductVariant extends Document {
  @Prop({ type: Types.ObjectId, ref: "Item", required: true })
  productId: Types.ObjectId;

  @Prop()
  color?: string;

  @Prop()
  size?: string;

  @Prop({ required: true })
  image: string;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop()
  sku?: string;
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

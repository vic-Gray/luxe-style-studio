import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

/* ---------------- ORDER ITEM ---------------- */
@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: "Item", required: false })
  itemId?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  image?: string;

  @Prop()
  size?: string;

  @Prop()
  color?: string;

  @Prop()
  slug?: string;

  @Prop()
  category?: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

/* ---------------- ORDER LOCATION (optional sub-document) ---------------- */
/**
 * Customer geolocation captured at checkout time.
 *
 * All fields are nullable with no default so that the sub-document is
 * absent on documents created before this field existed. This is purely
 * additive — existing documents are never rewritten.
 */
@Schema({ _id: false })
export class OrderLocation {
  /** Latitude in decimal degrees (-90 to 90). */
  @Prop({ type: Number, default: null })
  lat: number | null;

  /** Longitude in decimal degrees (-180 to 180). */
  @Prop({ type: Number, default: null })
  lng: number | null;

  /** GPS accuracy radius in metres (≥ 0). Optional — may be absent. */
  @Prop({ type: Number, default: null })
  accuracy: number | null;
}

export const OrderLocationSchema = SchemaFactory.createForClass(OrderLocation);

/* ---------------- ORDER ---------------- */
@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: false })
  userId?: Types.ObjectId;

  @Prop()
  fullName?: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items?: OrderItem[];

  @Prop({ required: true, min: 0 })
  total?: number;

  @Prop({ default: "NGN" })
  currency?: string;

  @Prop({
    default: "pending",
    enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
  })
  status?: string;

  @Prop()
  shippingAddress?: string;

  @Prop()
  deliveryAddress?: string;

  @Prop()
  deliveryLat?: number;

  @Prop()
  deliveryLng?: number;

  @Prop()
  googleMapsLink?: string;

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: "Payment", required: false })
  paymentId?: Types.ObjectId;

  // New fields
  @Prop({ default: false })
  isPaid: boolean;

  @Prop()
  paidAt?: Date;

  @Prop()
  customerNote?: string;

  @Prop()
  adminNote?: string;

  @Prop()
  trackingNumber?: string;

  @Prop()
  paystackReference?: string;

  /**
   * Optional customer geolocation captured at checkout.
   *
   * Absent on orders created before this field was added — treated as null
   * everywhere it is read. Never required. Never a condition for order
   * creation success.
   */
  @Prop({ type: OrderLocationSchema, default: null })
  location?: OrderLocation | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

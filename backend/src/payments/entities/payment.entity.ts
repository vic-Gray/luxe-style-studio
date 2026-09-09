import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ type: Types.ObjectId, ref: "Order", required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: "NGN" })
  currency: string;

  @Prop({
    default: "pending",
    enum: ["pending", "completed", "failed", "refunded"],
  })
  status: string;

  @Prop({ default: "manual", enum: ["manual", "stripe", "paypal", "razorpay"] })
  method: string;

  @Prop()
  transactionId?: string;

  @Prop()
  notes?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

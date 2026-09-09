import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PaymentsController } from "./controllers/payments.controller";
import { PaymentsService } from "./services/payments.service";
import { Payment, PaymentSchema } from "./entities/payment.entity";
import { OrdersModule } from "../orders/orders.module";
import { JwtModule } from "@nestjs/jwt";

/**
 * PaymentsModule - Handles payment management operations
 * Manual payment system ready for future 3PL integration
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),

    JwtModule.register({
      secret: process.env.JWT_SECRET || "supersecretkey",
      signOptions: { expiresIn: "7d" },
    }),
    OrdersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

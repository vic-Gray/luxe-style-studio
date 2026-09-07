import { Module } from "@nestjs/common";
import { AdminController } from "./controllers/admin.controller";
import { AdminService } from "./services/admin.service";
import { ItemsModule } from "../items/items.module";
import { UsersModule } from "../users/users.module";
import { OrdersModule } from "../orders/orders.module";
import { PaymentsModule } from "../payments/payments.module";
import { JwtModule } from "@nestjs/jwt";

/**
 * AdminModule - Handles admin dashboard operations
 * Aggregates data from all modules for dashboard analytics
 */
@Module({
  imports: [
    ItemsModule,
    UsersModule,
    OrdersModule,
    PaymentsModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET || "supersecretkey",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

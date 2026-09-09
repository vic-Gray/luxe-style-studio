import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrdersController } from "./controllers/orders.controller";
import { OrdersService } from "./services/orders.service";
import { Order, OrderSchema } from "./entities/order.entity";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { ItemsModule } from "../items/items.module";

/**
 * OrdersModule - Handles order management operations
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    UsersModule,
    forwardRef(() => ItemsModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "supersecretkey",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { ItemsModule } from "./items/items.module";
import { UsersModule } from "./users/users.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { AdminModule } from "./admin/admin.module";
import { SlideshowModule } from "./slideshow/slideshow.module";
import { ProductVariantsModule } from "./product-variants/product-variants.module";
import { ContactModule } from "./contact/contact.module";

@Module({
  imports: [
    // Configuration module for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    // MongoDB connection
    MongooseModule.forRoot(
      process.env.MONGODB_URI || "mongodb://localhost:27017/luxe-style-studio",
    ),
    // Feature modules
    AuthModule,
    ItemsModule,

    UsersModule,
    OrdersModule,
    PaymentsModule,
    AdminModule,
    SlideshowModule,
    ProductVariantsModule,
    ContactModule,
  ],
})
export class AppModule {}

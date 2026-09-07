import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ProductVariantsController } from "./controllers/product-variants.controller";
import { ProductVariantsService } from "./services/product-variants.service";

import {
  ProductVariant,
  ProductVariantSchema,
} from "./entities/product-variant.entity";

import { ItemsModule } from "../items/items.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductVariant.name, schema: ProductVariantSchema },
    ]),

    forwardRef(() => ItemsModule),

    AuthModule,
  ],

  controllers: [ProductVariantsController],

  providers: [ProductVariantsService],

  exports: [ProductVariantsService],
})
export class ProductVariantsModule {}

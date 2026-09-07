import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ItemsController } from "./controllers/items.controller";
import { ItemsService } from "./services/items.service";

import { Item, ItemSchema } from "./entities/item.entity";
import {
  ProductVariant,
  ProductVariantSchema,
} from "../product-variants/entities/product-variant.entity";

import { ProductVariantsModule } from "../product-variants/product-variants.module";

import { AuthModule } from "../auth/auth.module"; // ADD THIS

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
    ]),

    forwardRef(() => ProductVariantsModule),

    AuthModule, // ADD THIS
  ],

  controllers: [ItemsController],

  providers: [ItemsService],

  exports: [ItemsService],
})
export class ItemsModule {}

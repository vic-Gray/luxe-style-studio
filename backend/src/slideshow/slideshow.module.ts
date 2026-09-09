import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";

import { SlideshowController } from "./slideshow.controller";
import { SlideshowService } from "./slideshow.service";
import { Slideshow, SlideshowSchema } from "./slideshow.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Slideshow.name, schema: SlideshowSchema },
    ]),

    // ✅ Proper JWT Module Import
    JwtModule.register({
      secret: process.env.JWT_SECRET || "supersecretkey",
      signOptions: { expiresIn: "7d" },
    }),
  ],

  controllers: [SlideshowController],
  providers: [SlideshowService],
})
export class SlideshowModule {}

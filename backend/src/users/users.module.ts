import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UsersController } from "./controllers/users.controller";
import { UsersService } from "./services/users.service";
import { User, UserSchema } from "./entities/user.entity";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    JwtModule.register({
      secret: process.env.JWT_SECRET || "supersecretkey",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

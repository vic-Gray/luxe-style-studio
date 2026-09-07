import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as bcrypt from "bcrypt";
import { User } from "../entities/user.entity";
import { CreateUserDto, UpdateUserDto } from "../dto";

/**
 * UsersService - Handles user-related business logic
 */
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return user.save();
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      this.userModel.countDocuments(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).populate("orders");
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUserDto },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async remove(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async getUserCount(): Promise<number> {
    return this.userModel.countDocuments({ isActive: true });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }

  /**
   * Find or create a user during checkout
   * If user exists with the given email, update their info and return
   * If user doesn't exist, create a new one
   */
  async findOrCreateFromCheckout(userData: {
    email: string;
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  }): Promise<{ user: User; isNew: boolean }> {
    let user = await this.userModel.findOne({ email: userData.email });

    if (user) {
      // Update existing user with latest info
      user = await this.userModel.findByIdAndUpdate(
        user._id,
        {
          $set: {
            name: userData.name,
            phone: userData.phone || user.phone,
            address: userData.address || user.address,
            city: userData.city || user.city,
            country: userData.country || user.country,
            postalCode: userData.postalCode || user.postalCode,
          },
        },
        { new: true },
      );
      return { user: user!, isNew: false };
    } else {
      // Create new user
      const newUser = new this.userModel({
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        country: userData.country,
        postalCode: userData.postalCode,
        role: "customer",
        isActive: true,
        orders: [],
      });
      await newUser.save();
      return { user: newUser, isNew: true };
    }
  }

  /**
   * Add an order to user's orders array
   */
  async addOrderToUser(userId: string, orderId: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { orders: new Types.ObjectId(orderId) } },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Get user with order count
   */
  async findOneWithOrderCount(id: string): Promise<Record<string, unknown>> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      ...user.toObject(),
      orderCount: user.orders?.length || 0,
    };
  }

  /**
   * Get all users with their order counts
   */
  async findAllWithOrderCounts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      this.userModel.countDocuments(),
    ]);

    // Add order count to each user
    const usersWithCounts = data.map((user) => ({
      ...user.toObject(),
      orderCount: user.orders?.length || 0,
    }));

    return {
      data: usersWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

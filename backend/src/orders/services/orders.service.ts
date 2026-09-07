import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Order } from "../entities/order.entity";
import { CreateOrderDto, LocationDto, UpdateOrderStatusDto } from "../dto";
import { UsersService } from "../../users/services/users.service";
import { ItemsService } from "../../items/services/items.service";

/**
 * Validates the optional customer location payload.
 *
 * Returns a sanitized location object on success, or null if the value is
 * absent, null, or violates any constraint. Violations are logged (not thrown)
 * so that a bad location never blocks order creation.
 *
 * Rules:
 *  - lat must be a finite number in [-90, 90]
 *  - lng must be a finite number in [-180, 180]
 *  - accuracy, if present, must be a finite number >= 0
 */
export function validateLocation(
  raw: LocationDto | null | undefined,
  logger: Logger,
): { lat: number; lng: number; accuracy: number | null } | null {
  // Absent or explicitly null — this is the normal/majority case; return null silently.
  if (raw == null) {
    return null;
  }

  const { lat, lng, accuracy } = raw;

  // lat check
  if (
    typeof lat !== "number" ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90
  ) {
    logger.warn(
      `[validateLocation] Invalid lat value — dropping location. Received: ${JSON.stringify(raw)}`,
    );
    return null;
  }

  // lng check
  if (
    typeof lng !== "number" ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    logger.warn(
      `[validateLocation] Invalid lng value — dropping location. Received: ${JSON.stringify(raw)}`,
    );
    return null;
  }

  // accuracy check (optional field — skip if absent/null)
  let sanitizedAccuracy: number | null = null;
  if (accuracy != null) {
    if (
      typeof accuracy !== "number" ||
      !Number.isFinite(accuracy) ||
      accuracy < 0
    ) {
      logger.warn(
        `[validateLocation] Invalid accuracy value — dropping location. Received: ${JSON.stringify(raw)}`,
      );
      return null;
    }
    sanitizedAccuracy = accuracy;
  }

  return { lat, lng, accuracy: sanitizedAccuracy };
}

/**
 * OrdersService - Handles order-related business logic
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
  ) {}

  /**
   * CREATE ORDER (PRODUCTION SAFE VERSION)
   */
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    let userId: Types.ObjectId | undefined;

    // Create or find user
    if (createOrderDto.email) {
      const { user } = await this.usersService.findOrCreateFromCheckout({
        email: createOrderDto.email,
        name: createOrderDto.fullName || "",
        phone: createOrderDto.phone,
        address:
          createOrderDto.shippingAddress || createOrderDto.deliveryAddress,
      });

      userId = user._id as Types.ObjectId;
    }

    // Build safe product snapshot for each item
    const processedItems = await Promise.all(
      createOrderDto.items.map(async (item) => {
        let product = null;

        try {
          product = await this.itemsService.findOne(item.itemId);
        } catch (err) {
          product = null; // prevent crash if product missing
        }

        return {
          itemId: new Types.ObjectId(item.itemId),

          name: product?.name || item.name || "Unknown Product",

          image: product?.imageUrl || null,

          price: product?.price || item.price || 0,

          quantity: item.quantity || 1,

          size: item.size || null,

          color: item.color || null,

          slug: product?.slug || null,

          category: product?.category || null,
        };
      }),
    );

    // Create order
    const order = new this.orderModel({
      ...createOrderDto,
      currency: createOrderDto.currency || "NGN",
      userId,
      fullName: createOrderDto.fullName,
      email: createOrderDto.email,
      phone: createOrderDto.phone,
      items: processedItems,
      // Validate and sanitize the optional customer location before persisting.
      // validateLocation() returns null for absent, null, or out-of-range values
      // and logs a warning — the order is never rejected because of location.
      location: validateLocation(createOrderDto.location, this.logger),
    });

    const savedOrder = await order.save();

    // Attach order to user if exists
    if (userId) {
      await this.usersService.addOrderToUser(
        userId.toString(),
        savedOrder._id.toString(),
      );
    }

    return savedOrder;
  }

  /**
   * GET ALL ORDERS (ADMIN)
   */
  async findAll(page = 1, limit = 10, status?: string) {
    const query: any = { isPaid: true }; // add this
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.orderModel
        .find(query)
        .populate("userId", "name email phone address city country postalCode")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),

      this.orderModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * GET SINGLE ORDER
   */
  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate("userId", "name email phone address city country postalCode");

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * UPDATE ORDER STATUS
   */
  async updateStatus(
    id: string,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.orderModel.findByIdAndUpdate(
      id,
      { $set: updateStatusDto },
      { new: true },
    );

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * DELETE ORDER
   */
  async remove(id: string): Promise<Order> {
    const order = await this.orderModel.findByIdAndDelete(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * ORDER COUNT
   */
  async getOrderCount(): Promise<number> {
    return this.orderModel.countDocuments({ isPaid: true });
  }

  /**
   * TOTAL SALES
   */
  async getTotalSales(): Promise<number> {
    const result = await this.orderModel.aggregate([
      {
        $match: {
          status: { $in: ["paid", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    return result[0]?.total || 0;
  }

  /**
   * GET USER ORDERS
   */
  async getOrdersByUser(userId: string): Promise<Order[]> {
    return this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  async markAsPaid(orderId: string) {
    return this.orderModel.findByIdAndUpdate(
      orderId,
      {
        $set: {
          isPaid: true,
          paidAt: new Date(),
          status: "paid",
        },
      },
      { new: true },
    );
  }

  async getTotalRevenue(): Promise<number> {
    const result = await this.orderModel.aggregate([
      {
        $match: { isPaid: true },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    return result[0]?.total || 0;
  }

  /**
   * FIND ORDER BY PAYSTACK REFERENCE
   */
  async findByPaystackReference(reference: string): Promise<Order> {
    const order = await this.orderModel.findOne({
      paystackReference: reference,
    });
    if (!order) {
      throw new NotFoundException(
        `Order with Paystack reference ${reference} not found`,
      );
    }
    return order;
  }
}

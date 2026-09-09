import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { OrdersService } from "@/orders/services/orders.service";
import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Req,
  Res,
  Logger,
} from "@nestjs/common";
import { PaymentsService } from "../services/payments.service";
import { InitializePaymentDto } from "../dto";
import { Response, Request } from "express";
import * as crypto from "crypto";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * INITIALIZE PAYMENT
   * Accepts an existing order ID and initializes Paystack payment.
   * The order must have been created first via POST /api/orders.
   */
  @Post("initialize")
  @ApiOperation({
    summary: "Initialize payment",
    description: "Initializes Paystack payment for an existing order",
  })
  async initializePayment(
    @Body() initializePaymentDto: InitializePaymentDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const order = await this.ordersService.findOne(
      initializePaymentDto.orderId,
    );

    if (!order.email) {
      throw new Error("Order email is required for payment initialization");
    }
    if (!order.total) {
      throw new Error("Order total is required for payment initialization");
    }

    const response = await this.paymentsService.initializePayment(
      order.email,
      order.total,
      order._id.toString(),
    );

    const reference = response.data?.data?.reference;
    if (reference) {
      await this.ordersService.updateStatus(order._id.toString(), {
        paystackReference: reference,
      });
    }

    res.json({
      ...response.data,
      orderId: order._id.toString(),
    });
  }

  /**
   * VERIFY PAYMENT (frontend callback)
   */
  @Get("verify")
  @ApiOperation({
    summary: "Verify payment",
    description: "Verify payment status via Paystack and mark order as paid",
  })
  async verify(@Query("reference") reference: string) {
    const result = await this.paymentsService.verifyPayment(reference);
    const paystackData = result.data;

    if (paystackData.status === "success") {
      const order = await this.ordersService.findByPaystackReference(reference);
      await this.ordersService.markAsPaid(order._id.toString());
      return { success: true, orderId: order._id.toString(), reference };
    }

    return { success: false, reference };
  }

  /**
   * WEBHOOK (Paystack server-to-server)
   */
  @Post("webhook")
  @ApiOperation({
    summary: "Paystack webhook",
    description: "Handle Paystack charge.success webhook events",
  })
  async webhook(
    @Req()
    req: Request & {
      rawBody?: string;
      body?: { event?: string; data?: { reference?: string } };
    },
  ) {
    const logger = new Logger("PaymentsController");

    const paystackSignature = req.headers["x-paystack-signature"];
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      logger.error("PAYSTACK_SECRET_KEY is not set");
      return { received: false };
    }

    const signature = crypto
      .createHmac("sha512", secretKey)
      .update(req.rawBody)
      .digest("hex");

    if (signature !== paystackSignature) {
      logger.warn("Invalid Paystack webhook signature");
      return { received: false };
    }

    const event = req.body?.event;
    const data = req.body?.data;

    try {
      if (event === "charge.success") {
        const reference = data?.reference;
        if (reference) {
          const order =
            await this.ordersService.findByPaystackReference(reference);
          if (!order.isPaid) {
            // idempotent — skip if already paid
            await this.ordersService.markAsPaid(order._id.toString());
            logger.log(
              `Order ${order._id.toString()} marked as paid via webhook`,
            );
          }
        }
      }
    } catch (err) {
      logger.error("Error processing webhook", err as Error);
    }

    return { received: true };
  }
}

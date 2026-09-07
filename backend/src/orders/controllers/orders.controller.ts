import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { OrdersService } from "../services/orders.service";
import { UpdateOrderStatusDto } from "../dto";
import { JwtAuthGuard, RolesGuard } from "../../common/guards";
import { Roles } from "../../common/decorators";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get()
  @ApiOperation({
    summary: "Get all orders",
    description: "Retrieve paginated list of paid orders (Admin only)",
  })
  @ApiBearerAuth()
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "status", required: false })
  @ApiResponse({ status: 200, description: "List of orders" })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("status") status?: string,
  ) {
    return this.ordersService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      status,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get(":id")
  @ApiOperation({
    summary: "Get order by ID",
    description: "Retrieve single order details (Admin only)",
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Order details" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async findOne(@Param("id") id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Patch(":id/status")
  @ApiOperation({
    summary: "Update order status",
    description: "Update order status (Admin only)",
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Order status updated" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async updateStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateStatusDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Delete(":id")
  @ApiOperation({
    summary: "Cancel order",
    description: "Cancel/delete an order (Admin only)",
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Order cancelled" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async remove(@Param("id") id: string) {
    return this.ordersService.remove(id);
  }
}

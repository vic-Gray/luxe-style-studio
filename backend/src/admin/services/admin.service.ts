import { Injectable } from "@nestjs/common";
import { ItemsService } from "../../items/services/items.service";
import { UsersService } from "../../users/services/users.service";
import { OrdersService } from "../../orders/services/orders.service";
import { PaymentsService } from "../../payments/services/payments.service";

@Injectable()
export class AdminService {
  constructor(
    private itemsService: ItemsService,
    private usersService: UsersService,
    private ordersService: OrdersService,
    private paymentsService: PaymentsService,
  ) {}

  private calculateTrend(current: number, previous: number) {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  }

  /* ---------------- DASHBOARD ---------------- */

  async getDashboardData() {
    const now = new Date();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const [totalItems, totalUsers, totalOrders, totalSales, recentOrders] =
      await Promise.all([
        this.itemsService.getItemCount(),
        this.usersService.getUserCount(),
        this.ordersService.getOrderCount(),
        this.ordersService.getTotalRevenue(),
        this.ordersService.findAll(1, 5),
      ]);

    const ordersToday = await this.ordersService["orderModel"].countDocuments({
      isPaid: true,
      createdAt: { $gte: startOfToday },
    });

    const ordersYesterday = await this.ordersService[
      "orderModel"
    ].countDocuments({
      isPaid: true,
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });

    const salesTodayAgg = await this.ordersService["orderModel"].aggregate([
      { $match: { isPaid: true, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const salesYesterdayAgg = await this.ordersService["orderModel"].aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: startOfYesterday, $lt: startOfToday },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const salesToday = salesTodayAgg[0]?.total || 0;
    const salesYesterday = salesYesterdayAgg[0]?.total || 0;

    const ordersThisWeek = await this.ordersService[
      "orderModel"
    ].countDocuments({
      isPaid: true,
      createdAt: { $gte: startOfWeek },
    });

    const ordersLastWeek = await this.ordersService[
      "orderModel"
    ].countDocuments({
      isPaid: true,
      createdAt: { $gte: startOfLastWeek, $lt: startOfWeek },
    });

    return {
      totalSales,
      totalUsers,
      totalOrders,
      totalItems,

      recentOrders: recentOrders.data,

      analytics: {
        orders: {
          today: ordersToday,
          yesterday: ordersYesterday,
          trend: this.calculateTrend(ordersToday, ordersYesterday),
        },
        sales: {
          today: salesToday,
          yesterday: salesYesterday,
          trend: this.calculateTrend(salesToday, salesYesterday),
        },
        weeklyOrders: {
          thisWeek: ordersThisWeek,
          lastWeek: ordersLastWeek,
          trend: this.calculateTrend(ordersThisWeek, ordersLastWeek),
        },
      },
    };
  }

  /* ---------------- CLEAR ACTIVITY ---------------- */

  async clearAllDashboardData() {
    const result = await this.ordersService["orderModel"].db
      .collection("activities")
      .deleteMany({});

    return {
      message: "Dashboard activity cleared",
      deleted: {
        activities: result.deletedCount,
      },
    };
  }
}

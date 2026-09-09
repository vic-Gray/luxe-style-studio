import { Controller, Get, Delete, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { AdminService } from "../services/admin.service";
import { JwtAuthGuard, RolesGuard } from "../../common/guards";
import { Roles } from "../../common/decorators";

@ApiTags("admin")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  async getDashboard() {
    return this.adminService.getDashboardData();
  }

  @Delete("dashboard/clear")
  @ApiOperation({
    summary: "Clear dashboard activity",
    description: "Deletes only dashboard activity logs",
  })
  @ApiResponse({
    status: 200,
    description: "Dashboard activity cleared successfully",
  })
  async clearDashboardData() {
    return this.adminService.clearAllDashboardData();
  }
}

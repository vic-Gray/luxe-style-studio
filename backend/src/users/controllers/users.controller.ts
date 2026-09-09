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
import { UsersService } from "../services/users.service";
import { UpdateUserDto } from "../dto";
import { JwtAuthGuard, RolesGuard } from "../../common/guards";
import { Roles } from "../../common/decorators";

/**
 * UsersController - Handles user management endpoints (Admin only)
 */
@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: "Get all users",
    description: "Retrieve paginated list of users with order counts",
  })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiResponse({ status: 200, description: "List of users" })
  async findAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.usersService.findAllWithOrderCounts(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get user by ID",
    description: "Retrieve single user details",
  })
  @ApiResponse({ status: 200, description: "User details" })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("id") id: string) {
    return this.usersService.findOneWithOrderCount(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update user",
    description: "Update user information",
  })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete user", description: "Remove a user" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}

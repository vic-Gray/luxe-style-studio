import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from "@nestjs/swagger";
import { ItemsService } from "../services/items.service";

import { JwtAuthGuard, RolesGuard } from "../../common/guards";
import { Roles, CurrentUser, Public } from "../../common/decorators";
import { JwtPayload } from "../../common/interfaces";
import { memoryStorage } from "multer";
import { CreateItemDto } from "../dto";
import { UpdateItemDto } from "../dto/UpdateItemDto";

/**
 * ItemsController - Handles all item-related HTTP requests
 * Base path: /items
 */
@ApiTags("items")
@Controller("items")
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  /**
   * Upload image to Cloudinary (Admin only)
   * POST /items/upload-image
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post("upload-image")
  @UseInterceptors(
    FileInterceptor("image", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          callback(
            new BadRequestException("Only image files are allowed"),
            false,
          );
        } else {
          callback(null, true);
        }
      },
    }),
  )
  @ApiOperation({
    summary: "Upload image",
    description: "Upload image to Cloudinary (Admin only)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Image uploaded successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 400, description: "Bad request - Invalid file" })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    // Upload to Cloudinary with specific folder for variants
    const uploadResult = await this.itemsService.uploadImage(
      file,
      "luxe-style-studio/variants",
    );
    // Return just the url and publicId as requested
    return {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    };
  }

  /**
   * Create a new item (Admin only)
   * POST /items
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post()
  @UseInterceptors(
    FileInterceptor("image", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          callback(
            new BadRequestException("Only image files are allowed"),
            false,
          );
        } else {
          callback(null, true);
        }
      },
    }),
  )
  @ApiOperation({
    summary: "Create new item",
    description: "Create a new item (Admin only)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: "Item created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async create(
    @Body() createItemDto: CreateItemDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    let imageUrl = createItemDto.imageUrl;

    // If file is uploaded, upload to Cloudinary
    if (file) {
      const uploadResult = await this.itemsService.uploadImage(file);
      imageUrl = uploadResult.url;
    }

    if (!imageUrl) {
      throw new BadRequestException("Image is required");
    }

    return this.itemsService.create({ ...createItemDto, imageUrl }, user.sub);
  }

  /**
   * Get all items (Public access)
   * GET /items
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: "Get all items",
    description: "Retrieve paginated list of items",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "category", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiResponse({ status: 200, description: "List of items" })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("category") category?: string,
    @Query("search") search?: string,
  ) {
    return this.itemsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      category,
      search,
    );
  }

  /**
   * Update item (Admin only)
   * PATCH /items/:id
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Patch(":id")
  @ApiOperation({
    summary: "Update item",
    description: "Update item details (Admin only)",
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Item updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Item not found" })
  async update(@Param("id") id: string, @Body() updateItemDto: UpdateItemDto) {
    return this.itemsService.update(id, updateItemDto);
  }

  /**
   * Delete item (Admin only)
   * DELETE /items/:id
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete item",
    description: "Soft delete item (Admin only)",
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: "Item deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Item not found" })
  async remove(@Param("id") id: string) {
    return this.itemsService.remove(id);
  }

  /**
   * Get all categories (Public access)
   * GET /items/categories/list
   */
  @Public()
  @Get("categories/list")
  @ApiOperation({
    summary: "Get all categories",
    description: "Retrieve list of all categories",
  })
  @ApiResponse({ status: 200, description: "List of categories" })
  async getCategories() {
    return this.itemsService.getCategories();
  }

  /**
   * Get item by ID with variants (Public access)
   * GET /items/:id
   */
  @Public()
  @Get(":id")
  @ApiOperation({
    summary: "Get item by ID",
    description: "Retrieve a single item with its variants",
  })
  @ApiResponse({ status: 200, description: "Item found with variants" })
  @ApiResponse({ status: 404, description: "Item not found" })
  async findOne(@Param("id") id: string) {
    return this.itemsService.findOne(id);
  }
}

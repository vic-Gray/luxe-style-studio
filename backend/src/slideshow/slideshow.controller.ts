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
import { SlideshowService } from "./slideshow.service";
import { CreateSlideshowDto, UpdateSlideshowDto } from "./dto";
import { JwtAuthGuard, RolesGuard } from "../common/guards";
import { Roles, CurrentUser, Public } from "../common/decorators";
import { JwtPayload } from "../common/interfaces";
import { memoryStorage } from "multer";

/**
 * SlideshowController - Handles all slideshow-related HTTP requests
 * Base path: /slideshow
 */
@ApiTags("slideshow")
@Controller("slideshow")
export class SlideshowController {
  constructor(private readonly slideshowService: SlideshowService) {}

  /**
   * Create a new slideshow image (Admin only)
   * POST /slideshow
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
    summary: "Create new slideshow image",
    description: "Create a new slideshow image (Admin only)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: "Slideshow image created successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async create(
    @Body() createSlideshowDto: CreateSlideshowDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    let imageUrl = createSlideshowDto.imageUrl;

    // If file is uploaded, upload to Cloudinary
    if (file) {
      const uploadResult = await this.slideshowService.uploadImage(file);
      imageUrl = uploadResult.url;
    }

    if (!imageUrl) {
      throw new BadRequestException("Image is required");
    }

    return this.slideshowService.create(
      { ...createSlideshowDto, imageUrl },
      user.sub,
    );
  }

  /**
   * Get all slideshow images (Public access)
   * GET /slideshow
   * GET /slideshow?search=text&page=1&limit=10
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: "Get all slideshow images",
    description: "Retrieve paginated list of slideshow images",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiResponse({ status: 200, description: "List of slideshow images" })
  async findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
  ) {
    return this.slideshowService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      search,
    );
  }

  /**
   * Get slideshow image by ID (Public access)
   * GET /slideshow/:id
   */
  @Public()
  @Get(":id")
  @ApiOperation({
    summary: "Get slideshow image by ID",
    description: "Retrieve single slideshow image details",
  })
  @ApiResponse({ status: 200, description: "Slideshow image details" })
  @ApiResponse({ status: 404, description: "Slideshow image not found" })
  async findOne(@Param("id") id: string) {
    return this.slideshowService.findOne(id);
  }

  /**
   * Update slideshow image (Admin only)
   * PATCH /slideshow/:id
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Patch(":id")
  @ApiOperation({
    summary: "Update slideshow image",
    description: "Update slideshow image details (Admin only)",
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: "Slideshow image updated successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Slideshow image not found" })
  async update(
    @Param("id") id: string,
    @Body() updateSlideshowDto: UpdateSlideshowDto,
  ) {
    return this.slideshowService.update(id, updateSlideshowDto);
  }

  /**
   * Delete all slideshow images (Admin only)
   * DELETE /slideshow/delete-all
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Delete("delete-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete all slideshow images",
    description: "Delete all slideshow images (Admin only)",
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 204,
    description: "All slideshow images deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async deleteAll() {
    return this.slideshowService.deleteAll();
  }

  /**
   * Delete slideshow image (Admin only)
   * DELETE /slideshow/:id
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete slideshow image",
    description: "Soft delete slideshow image (Admin only)",
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 204,
    description: "Slideshow image deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Slideshow image not found" })
  async remove(@Param("id") id: string) {
    return this.slideshowService.remove(id);
  }

  /**
   * Get slideshow count (Public access)
   * GET /slideshow/count
   */
  @Public()
  @Get("count")
  @ApiOperation({
    summary: "Get slideshow count",
    description: "Retrieve total number of slideshow images",
  })
  @ApiResponse({ status: 200, description: "Slideshow count" })
  async getCount() {
    return this.slideshowService.getCount();
  }
}

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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { ProductVariantsService } from "../services/product-variants.service";
import { CreateProductVariantDto, UpdateProductVariantDto } from "../dto";
import { JwtAuthGuard, RolesGuard } from "../../common/guards";
import { Roles, Public } from "../../common/decorators";

@ApiTags("product-variants")
@Controller("product-variants")
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Public()
  @Get("product/:productId")
  @ApiOperation({
    summary: "Get variants by product",
    description: "Returns all variants for a product",
  })
  @ApiResponse({ status: 200, description: "List of variants" })
  findByProductId(@Param("productId") productId: string) {
    return this.productVariantsService.findByProductId(productId);
  }

  @Public()
  @Get(":id")
  @ApiOperation({
    summary: "Get variant by ID",
    description: "Returns a single variant",
  })
  @ApiResponse({ status: 200, description: "Variant found" })
  @ApiResponse({ status: 404, description: "Variant not found" })
  findOne(@Param("id") id: string) {
    return this.productVariantsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post()
  @ApiOperation({
    summary: "Create variant",
    description: "Create a new product variant (Admin only)",
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: "Variant created" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  create(@Body() createDto: CreateProductVariantDto) {
    return this.productVariantsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Patch(":id")
  @ApiOperation({
    summary: "Update variant",
    description: "Update a variant (Admin only)",
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Variant updated" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Variant not found" })
  update(@Param("id") id: string, @Body() updateDto: UpdateProductVariantDto) {
    return this.productVariantsService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Delete(":id")
  @ApiOperation({
    summary: "Delete variant",
    description: "Delete a variant (Admin only)",
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: "Variant deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Variant not found" })
  async remove(@Param("id") id: string) {
    await this.productVariantsService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get()
  @ApiOperation({
    summary: "Get all variants",
    description:
      "Returns all variants, optionally filtered by productId (Admin only)",
  })
  @ApiBearerAuth()
  @ApiQuery({ name: "productId", required: false, type: String })
  @ApiResponse({ status: 200, description: "List of variants" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  findAll(@Query("productId") productId?: string) {
    return this.productVariantsService.findAll(productId);
  }
}

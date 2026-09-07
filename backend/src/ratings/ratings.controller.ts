import { Controller, Post, Body, Get, Param, UseGuards } from "@nestjs/common";
import { RatingsService } from "./ratings.service";
import { CreateRatingDto } from "./dto/create-rating.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators";
import { JwtPayload } from "@/common/interfaces";

@Controller("ratings")
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  /**
   * Rate an item (create or update rating)
   * POST /ratings/:itemId
   */
  @Post(":itemId")
  @UseGuards(JwtAuthGuard)
  async rateItem(
    @Param("itemId") itemId: string,
    @Body() createRatingDto: CreateRatingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ratingsService.rateItem(
      createRatingDto,
      user.sub, // user ID from JWT
      itemId,
    );
  }

  /**
   * Get average rating for an item
   * GET /ratings/:itemId/average
   */
  @Get(":itemId/average")
  async getItemRating(@Param("itemId") itemId: string) {
    return this.ratingsService.getItemRating(itemId);
  }

  /**
   * Get current user's rating for an item
   * GET /ratings/:itemId/my
   */
  @Get(":itemId/my")
  @UseGuards(JwtAuthGuard)
  async getUserRating(
    @Param("itemId") itemId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ratingsService.getUserRatingForItem(user.sub, itemId);
  }
}

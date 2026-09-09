import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Rating } from "./entities/rating.entity";
import { CreateRatingDto } from "./dto/create-rating.dto";

@Injectable()
export class RatingsService {
  constructor(@InjectModel(Rating.name) private ratingModel: Model<Rating>) {}

  /**
   * Create a new rating or update existing one for a user and item
   * @param createRatingDto - Rating data
   * @param userId - ID of the user rating
   * @param itemId - ID of the item being rated
   * @returns Created or updated rating
   */
  async rateItem(
    createRatingDto: CreateRatingDto,
    userId: string,
    itemId: string,
  ): Promise<Rating> {
    // Check if user has already rated this item
    const existingRating = await this.ratingModel.findOne({
      userId,
      itemId,
    });

    if (existingRating) {
      // Update existing rating
      existingRating.value = createRatingDto.value;
      return existingRating.save();
    } else {
      // Create new rating
      const rating = new this.ratingModel({
        userId,
        itemId,
        value: createRatingDto.value,
      });
      return rating.save();
    }
  }

  /**
   * Get average rating for an item
   * @param itemId - ID of the item
   * @returns Average rating and count
   */
  async getItemRating(
    itemId: string,
  ): Promise<{ average: number; count: number }> {
    const ratings = await this.ratingModel.find({ itemId });
    if (ratings.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = ratings.reduce((acc, rating) => acc + rating.value, 0);
    const average = sum / ratings.length;

    return { average, count: ratings.length };
  }

  /**
   * Get rating by user for a specific item
   * @param userId - ID of the user
   * @param itemId - ID of the item
   * @returns User's rating for the item or null if not rated
   */
  async getUserRatingForItem(
    userId: string,
    itemId: string,
  ): Promise<Rating | null> {
    return this.ratingModel.findOne({ userId, itemId });
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { Slideshow, SlideshowDocument } from './slideshow.entity';
import { CreateSlideshowDto, UpdateSlideshowDto } from './dto';
import { PaginatedResult } from '../common/interfaces';

@Injectable()
export class SlideshowService {
  constructor(
    @InjectModel(Slideshow.name) private slideshowModel: Model<SlideshowDocument>,
  ) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Create a new slideshow image
   * @param createSlideshowDto - Slideshow data
   * @param createdBy - Admin ID who created the slideshow
   * @returns Created slideshow
   */
  async create(createSlideshowDto: CreateSlideshowDto, createdBy?: string): Promise<Slideshow> {
    const { Types } = await import('mongoose');
    const slideshow = new this.slideshowModel({
      ...createSlideshowDto,
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
    });
    return slideshow.save();
  }

/**
     * Get all slideshow images with pagination
     * @param page - Page number (1-based)
     * @param limit - Items per page
     * @param search - Optional search term to filter by title or displayText
     * @returns Paginated list of slideshow images
     */
  async findAll(page: number = 1, limit: number = 10, search?: string): Promise<PaginatedResult<Slideshow>> {
    const skip = (page - 1) * limit;
    
    // Build query filter
    const filter: Record<string, unknown> = { isActive: true };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { displayText: { $regex: search, $options: 'i' } },
      ];
    }
    
    const [data, total] = await Promise.all([
      this.slideshowModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ order: 1, createdAt: -1 })
        .exec(),
      this.slideshowModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single slideshow image by ID
   * @param id - Slideshow ID
   * @returns Slideshow details
   */
  async findOne(id: string): Promise<Slideshow> {
    const slideshow = await this.slideshowModel.findById(id);
    if (!slideshow) {
      throw new NotFoundException(`Slideshow with ID ${id} not found`);
    }
    return slideshow;
  }

  /**
   * Update an existing slideshow image
   * @param id - Slideshow ID
   * @param updateSlideshowDto - Updated slideshow data
   * @returns Updated slideshow
   */
  async update(id: string, updateSlideshowDto: UpdateSlideshowDto): Promise<Slideshow> {
    const slideshow = await this.slideshowModel.findByIdAndUpdate(
      id,
      { $set: updateSlideshowDto },
      { new: true, runValidators: true },
    );
    
    if (!slideshow) {
      throw new NotFoundException(`Slideshow with ID ${id} not found`);
    }
    
    return slideshow;
  }

/**
     * Remove a slideshow image
     * @param id - Slideshow ID
     * @returns Removed slideshow
     */
    async remove(id: string): Promise<Slideshow> {
        const slideshow = await this.slideshowModel.findByIdAndUpdate(
            id,
            { $set: { isActive: false } },
            { new: true },
        );

        if (!slideshow) {
            throw new NotFoundException(`Slideshow with ID ${id} not found`);
        }

        return slideshow;
    }

    /**
     * Delete all slideshow images
     * @returns Number of deleted images
     */
    async deleteAll(): Promise<{ deletedCount: number }> {
        const result = await this.slideshowModel.deleteMany({}).exec();
        return { deletedCount: result.deletedCount || 0 };
    }

  /**
   * Upload image to Cloudinary
   * @param file - Image file buffer
   * @returns Cloudinary upload result with URL
   */
  async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'luxe-style-studio/slideshow',
          resource_type: 'image',
          transformation: [
            { width: 1920, height: 1080, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(new BadRequestException('Failed to upload image to Cloudinary'));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new BadRequestException('No result from Cloudinary'));
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Delete image from Cloudinary
   * @param publicId - Cloudinary public ID
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
    }
  }

  /**
   * Get slideshow count
   * @returns Total number of active slideshow images
   */
  async getCount(): Promise<number> {
    return this.slideshowModel.countDocuments({ isActive: true });
  }
}
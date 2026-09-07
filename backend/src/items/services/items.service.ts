import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { Item } from '../entities/item.entity';
import { ProductVariant } from '../../product-variants/entities/product-variant.entity';
import { PaginatedResult } from '../../common/interfaces';
import { UpdateItemDto } from '../dto/UpdateItemDto';
import { CreateItemDto } from '../dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(ProductVariant.name) private productVariantModel: Model<ProductVariant>,
   
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async create(createItemDto: CreateItemDto, createdBy?: string): Promise<Item> {
    const item = new this.itemModel({
      ...createItemDto,
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
    });
    return item.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    category?: string,
    search?: string,
  ): Promise<PaginatedResult<Item>> {
    const query: Record<string, unknown> = { isActive: true };

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.itemModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.itemModel.countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

async findOne(id: string): Promise<Record<string, unknown>> {
    const item = await this.itemModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    const variants = await this.productVariantModel
      .find({ productId: new Types.ObjectId(id) })
      .sort({ createdAt: 1 })
      .exec();
    return { ...item.toObject(), variants };
  }


  async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    const item = await this.itemModel.findByIdAndUpdate(
      id, { $set: updateItemDto }, { new: true, runValidators: true },
    );
    if (!item) throw new NotFoundException(`Item with ID ${id} not found`);
    return item;
  }

  async remove(id: string): Promise<Item> {
    const item = await this.itemModel.findByIdAndUpdate(
      id, { $set: { isActive: false } }, { new: true },
    );
    if (!item) throw new NotFoundException(`Item with ID ${id} not found`);
    return item;
  }

   async getCategories(): Promise<string[]> {
     return this.itemModel.distinct('category', { isActive: true, category: { $ne: null } });
   }

   async uploadImage(file: Express.Multer.File, folder: string = 'luxe-style-studio'): Promise<{ url: string; publicId: string }> {
     return new Promise((resolve, reject) => {
       const uploadStream = cloudinary.uploader.upload_stream(
         {
           folder: folder,
           resource_type: 'image',
           transformation: [
             { width: 800, height: 800, crop: 'limit' },
             { quality: 'auto:good' },
             { fetch_format: 'auto' },
           ],
         },
         (error, result) => {
           if (error) reject(new BadRequestException('Failed to upload image to Cloudinary'));
           else if (result) resolve({ url: result.secure_url, publicId: result.public_id });
           else reject(new BadRequestException('No result from Cloudinary'));
         },
       );
       uploadStream.end(file.buffer);
     });
   }

  async deleteImage(publicId: string): Promise<void> {
    try { await cloudinary.uploader.destroy(publicId); }
    catch (error) { console.error('Failed to delete image from Cloudinary:', error); }
  }

  async getItemCount(): Promise<number> {
    return this.itemModel.countDocuments({ isActive: true });
  }
}

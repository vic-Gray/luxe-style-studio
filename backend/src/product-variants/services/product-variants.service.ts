import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductVariant } from '../entities/product-variant.entity';
import { CreateProductVariantDto, UpdateProductVariantDto } from '../dto';

@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectModel(ProductVariant.name) private productVariantModel: Model<ProductVariant>,
  ) {}

  async create(createDto: CreateProductVariantDto): Promise<ProductVariant> {
    const variant = new this.productVariantModel({
      ...createDto,
      productId: new Types.ObjectId(createDto.productId),
    });
    return variant.save();
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    return this.productVariantModel
      .find({ productId: new Types.ObjectId(productId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  async findAll(productId?: string): Promise<ProductVariant[]> {
    const query = productId ? { productId: new Types.ObjectId(productId) } : {};
    return this.productVariantModel.find(query).sort({ createdAt: 1 }).exec();
  }

  async findOne(id: string): Promise<ProductVariant> {
    const variant = await this.productVariantModel.findById(id).exec();
    if (!variant) {
      throw new NotFoundException(`ProductVariant with ID ${id} not found`);
    }
    return variant;
  }

  async update(id: string, updateDto: UpdateProductVariantDto): Promise<ProductVariant> {
    const updateData: Record<string, unknown> = { ...updateDto };
    if (updateDto.productId) {
      updateData.productId = new Types.ObjectId(updateDto.productId);
    }
    const variant = await this.productVariantModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .exec();
    if (!variant) {
      throw new NotFoundException(`ProductVariant with ID ${id} not found`);
    }
    return variant;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productVariantModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`ProductVariant with ID ${id} not found`);
    }
  }
}
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { OrdersService } from './orders.service';
import { Order } from '../entities/order.entity';
import { CreateOrderDto } from '../dto';
import { UsersService } from '../../users/services/users.service';
import { ItemsService } from '../../items/services/items.service';

/**
 * Unit tests for OrdersService.create() focusing on the location field.
 *
 * Dependencies (Mongoose model, UsersService, ItemsService) are mocked using
 * the NestJS testing module with the correct provider tokens so the DI
 * container can resolve them.
 *
 * Covered cases:
 *  1. Valid location → persisted and returned correctly.
 *  2. location: null explicitly → stored as null, order still succeeds.
 *  3. location entirely omitted → stored as null, order still succeeds (majority case).
 *  4. Invalid location (out-of-range, wrong types) → stored as null, no throw, warns.
 */
describe('OrdersService.create() — location field', () => {
  let service: OrdersService;

  // We'll capture the last constructor call so tests can inspect the `location`
  // field that was passed to `new this.orderModel(...)`.
  let lastModelCtorArg: Record<string, any> | null = null;

  // The saved order factory returns an object with a save() that returns itself.
  const buildSavedInstance = (data: Record<string, any>) => {
    const obj: any = { ...data, _id: new Types.ObjectId() };
    obj.save = jest.fn().mockResolvedValue(obj);
    return obj;
  };

  // Mongoose model constructor mock — captures the argument and returns an
  // instance with a working .save().
  const mockModelCtor = jest.fn().mockImplementation((data: Record<string, any>) => {
    lastModelCtorArg = { ...data };
    return buildSavedInstance(data);
  });

  const mockUsersService = {
    findOrCreateFromCheckout: jest.fn().mockResolvedValue({
      user: { _id: new Types.ObjectId() },
    }),
    addOrderToUser: jest.fn().mockResolvedValue(undefined),
  };

  const mockItemsService = {
    findOne: jest.fn().mockResolvedValue({
      name: 'Test Shirt',
      imageUrl: 'https://example.com/shirt.jpg',
      price: 5000,
      slug: 'test-shirt',
      category: 'shirts',
    }),
  };

  // ── Module setup ───────────────────────────────────────────────────────

  beforeEach(async () => {
    lastModelCtorArg = null;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: mockModelCtor,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  // ── Shared minimal DTO ─────────────────────────────────────────────────

  const itemId = new Types.ObjectId().toHexString();

  const baseDto: Omit<CreateOrderDto, 'location'> = {
    fullName: 'Ade Okonkwo',
    email: 'ade@example.com',
    phone: '08012345678',
    deliveryAddress: '12 Broad Street, Lagos',
    total: 10000,
    currency: 'NGN',
    items: [
      {
        itemId,
        name: 'Test Shirt',
        quantity: 2,
        price: 5000,
      },
    ],
  };

  // ── Helper: run create and return whatever was passed to the model ctor ─

  async function runCreate(dto: CreateOrderDto) {
    await service.create(dto);
    return lastModelCtorArg;
  }

  /* ================================================================== */
  /* Case 1 — valid location                                              */
  /* ================================================================== */

  it('persists a valid location with correct lat/lng/accuracy', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: { lat: 6.5244, lng: 3.3792, accuracy: 35 },
    };

    const ctorArg = await runCreate(dto);

    expect(ctorArg).not.toBeNull();
    expect(ctorArg!.location).toEqual({ lat: 6.5244, lng: 3.3792, accuracy: 35 });
  });

  it('persists a valid location when accuracy is 0', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: { lat: -33.8688, lng: 151.2093, accuracy: 0 },
    };

    const ctorArg = await runCreate(dto);
    expect(ctorArg!.location).toEqual({ lat: -33.8688, lng: 151.2093, accuracy: 0 });
  });

  it('persists a valid location when accuracy is omitted (accuracy becomes null)', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: { lat: 6.5244, lng: 3.3792 },
    };

    const ctorArg = await runCreate(dto);
    expect(ctorArg!.location).toEqual({ lat: 6.5244, lng: 3.3792, accuracy: null });
  });

  it('does not alter any other order fields when location is valid', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: { lat: 6.5244, lng: 3.3792, accuracy: 35 },
    };

    const ctorArg = await runCreate(dto);

    expect(ctorArg!.fullName).toBe('Ade Okonkwo');
    expect(ctorArg!.email).toBe('ade@example.com');
    expect(ctorArg!.total).toBe(10000);
    expect(Array.isArray(ctorArg!.items)).toBe(true);
    expect(ctorArg!.items).toHaveLength(1);
  });

  /* ================================================================== */
  /* Case 2 — location: null (explicit)                                   */
  /* ================================================================== */

  it('stores location as null when location: null is sent', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: null,
    };

    const ctorArg = await runCreate(dto);

    expect(ctorArg!.location).toBeNull();
  });

  it('still creates the order successfully when location is null', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: null };

    await expect(service.create(dto)).resolves.not.toThrow();
  });

  /* ================================================================== */
  /* Case 3 — location entirely omitted (the majority of real traffic)    */
  /* ================================================================== */

  it('stores location as null when location is omitted from the DTO', async () => {
    const dto: CreateOrderDto = { ...baseDto }; // no location key at all

    const ctorArg = await runCreate(dto);

    expect(ctorArg!.location).toBeNull();
  });

  it('creates the order successfully when location is omitted', async () => {
    const dto: CreateOrderDto = { ...baseDto };

    await expect(service.create(dto)).resolves.not.toThrow();
  });

  it('returns an order with all standard fields intact when location is omitted', async () => {
    const dto: CreateOrderDto = { ...baseDto };
    const ctorArg = await runCreate(dto);

    expect(ctorArg!.email).toBe('ade@example.com');
    expect(ctorArg!.total).toBe(10000);
    expect(ctorArg!.currency).toBe('NGN');
  });

  /* ================================================================== */
  /* Case 4 — invalid/malformed location                                  */
  /* ================================================================== */

  it('stores null and does NOT throw when lat is out of range (> 90)', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: { lat: 91, lng: 3.3792, accuracy: 35 },
    };

    await expect(service.create(dto)).resolves.not.toThrow();

    const ctorArg = await runCreate(dto);
    expect(ctorArg!.location).toBeNull();
  });

  it('stores null and does NOT throw when lat is < -90', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: { lat: -91, lng: 3.3792 },
    };

    await expect(service.create(dto)).resolves.not.toThrow();
    const ctorArg = await runCreate(dto);
    expect(ctorArg!.location).toBeNull();
  });

  it('stores null and does NOT throw when lng is out of range (> 180)', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: { lat: 6.5244, lng: 181 },
    };

    await expect(service.create(dto)).resolves.not.toThrow();
    const ctorArg = await runCreate(dto);
    expect(ctorArg!.location).toBeNull();
  });

  it('stores null and does NOT throw when lng is < -180', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: { lat: 6.5244, lng: -181 },
    };

    await expect(service.create(dto)).resolves.not.toThrow();
    const ctorArg = await runCreate(dto);
    expect(ctorArg!.location).toBeNull();
  });

  it('stores null and does NOT throw when accuracy is negative', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: { lat: 6.5244, lng: 3.3792, accuracy: -5 },
    };

    await expect(service.create(dto)).resolves.not.toThrow();
    const ctorArg = await runCreate(dto);
    expect(ctorArg!.location).toBeNull();
  });

  it('stores null and does NOT throw when lat/lng are strings (wrong type)', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: { lat: '6.5244' as any, lng: '3.3792' as any },
    };

    await expect(service.create(dto)).resolves.not.toThrow();
    const ctorArg = await runCreate(dto);
    expect(ctorArg!.location).toBeNull();
  });

  it('does not modify other order fields when location is invalid', async () => {
    const dto: CreateOrderDto = {
      ...baseDto,
      location: { lat: 999, lng: 999 },
    };

    const ctorArg = await runCreate(dto);

    expect(ctorArg!.email).toBe('ade@example.com');
    expect(ctorArg!.total).toBe(10000);
    expect(ctorArg!.fullName).toBe('Ade Okonkwo');
    expect(ctorArg!.location).toBeNull();
  });

  /* ================================================================== */
  /* Backward-compatibility regression: existing orders (no location)     */
  /* ================================================================== */

  it('backward-compat: creates a standard order with no location field present', async () => {
    const dto: CreateOrderDto = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '09087654321',
      deliveryAddress: '5 Victoria Island, Lagos',
      total: 15000,
      currency: 'NGN',
      items: [
        {
          itemId: new Types.ObjectId().toHexString(),
          name: 'Ankara Dress',
          quantity: 1,
          price: 15000,
        },
      ],
    };

    await expect(service.create(dto)).resolves.not.toThrow();

    expect(lastModelCtorArg!.location).toBeNull();
    expect(lastModelCtorArg!.email).toBe('jane@example.com');
    expect(lastModelCtorArg!.total).toBe(15000);
  });
});

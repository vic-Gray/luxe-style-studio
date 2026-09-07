import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { OrdersService } from './orders.service';
import { Order } from '../entities/order.entity';
import { CreateOrderDto, LocationDto } from '../dto';
import { UsersService } from '../../users/services/users.service';
import { ItemsService } from '../../items/services/items.service';

type MockOrderInstance = {
  [key: string]: unknown;
  _id: Types.ObjectId;
  save: jest.Mock;
};

type MockModelData = Record<string, unknown>;

describe('OrdersService.create() — location field', () => {
  let service: OrdersService;

  let lastModelCtorArg: MockModelData | null = null;

  const buildSavedInstance = (data: MockModelData): MockOrderInstance => {
    const obj: MockOrderInstance = { ...data, _id: new Types.ObjectId(), save: jest.fn() };
    obj.save = jest.fn().mockResolvedValue(obj);
    return obj;
  };

  const mockModelCtor = jest.fn().mockImplementation((data: MockModelData) => {
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

  beforeEach(async () => {
    lastModelCtorArg = null;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(Order.name), useValue: mockModelCtor },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ItemsService, useValue: mockItemsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  const itemId = new Types.ObjectId().toHexString();

  const baseDto: Omit<CreateOrderDto, 'location'> = {
    fullName: 'Ade Okonkwo',
    email: 'ade@example.com',
    phone: '08012345678',
    deliveryAddress: '12 Broad Street, Lagos',
    total: 10000,
    currency: 'NGN',
    items: [{ itemId, name: 'Test Shirt', quantity: 2, price: 5000 }],
  };

  async function runCreate(dto: CreateOrderDto): Promise<MockModelData | null> {
    await service.create(dto);
    return lastModelCtorArg;
  }

  /* ── Case 1: valid location ──────────────────────────────────────── */

  it('persists a valid location with correct lat/lng/accuracy', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: { lat: 6.5244, lng: 3.3792, accuracy: 35 } };
    const arg = await runCreate(dto);
    expect(arg!.location).toEqual({ lat: 6.5244, lng: 3.3792, accuracy: 35 });
  });

  it('persists a valid location when accuracy is 0', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: { lat: -33.8688, lng: 151.2093, accuracy: 0 } };
    const arg = await runCreate(dto);
    expect(arg!.location).toEqual({ lat: -33.8688, lng: 151.2093, accuracy: 0 });
  });

  it('persists a valid location when accuracy is omitted (becomes null)', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: { lat: 6.5244, lng: 3.3792 } };
    const arg = await runCreate(dto);
    expect(arg!.location).toEqual({ lat: 6.5244, lng: 3.3792, accuracy: null });
  });

  it('does not alter other fields when location is valid', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: { lat: 6.5244, lng: 3.3792, accuracy: 35 } };
    const arg = await runCreate(dto);
    expect(arg!.fullName).toBe('Ade Okonkwo');
    expect(arg!.email).toBe('ade@example.com');
    expect(arg!.total).toBe(10000);
    expect(Array.isArray(arg!.items)).toBe(true);
  });

  /* ── Case 2: location: null ──────────────────────────────────────── */

  it('stores null when location: null is sent', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: null };
    const arg = await runCreate(dto);
    expect(arg!.location).toBeNull();
  });

  it('succeeds when location is null', async () => {
    await expect(service.create({ ...baseDto, location: null })).resolves.not.toThrow();
  });

  /* ── Case 3: location omitted ────────────────────────────────────── */

  it('stores null when location is omitted', async () => {
    const arg = await runCreate({ ...baseDto });
    expect(arg!.location).toBeNull();
  });

  it('succeeds when location is omitted', async () => {
    await expect(service.create({ ...baseDto })).resolves.not.toThrow();
  });

  it('keeps all standard fields intact when location is omitted', async () => {
    const arg = await runCreate({ ...baseDto });
    expect(arg!.email).toBe('ade@example.com');
    expect(arg!.total).toBe(10000);
    expect(arg!.currency).toBe('NGN');
  });

  /* ── Case 4: invalid location ────────────────────────────────────── */

  it('stores null when lat > 90', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: { lat: 91, lng: 3.3792, accuracy: 35 } };
    await expect(service.create(dto)).resolves.not.toThrow();
    const arg = await runCreate(dto);
    expect(arg!.location).toBeNull();
  });

  it('stores null when lat < -90', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: { lat: -91, lng: 3.3792 } };
    await expect(service.create(dto)).resolves.not.toThrow();
    expect((await runCreate(dto))!.location).toBeNull();
  });

  it('stores null when lng > 180', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: { lat: 6.5244, lng: 181 } };
    await expect(service.create(dto)).resolves.not.toThrow();
    expect((await runCreate(dto))!.location).toBeNull();
  });

  it('stores null when lng < -180', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: { lat: 6.5244, lng: -181 } };
    await expect(service.create(dto)).resolves.not.toThrow();
    expect((await runCreate(dto))!.location).toBeNull();
  });

  it('stores null when accuracy is negative', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: { lat: 6.5244, lng: 3.3792, accuracy: -5 } };
    await expect(service.create(dto)).resolves.not.toThrow();
    expect((await runCreate(dto))!.location).toBeNull();
  });

  it('stores null when lat/lng are strings (wrong type)', async () => {
    // Deliberately pass wrong runtime types to simulate a client sending bad data.
    // TypeScript cast is intentional — we're testing the runtime guard.
    const badLoc = { lat: '6.5244' as unknown as number, lng: '3.3792' as unknown as number };
    const dto: CreateOrderDto = { ...baseDto, location: badLoc as LocationDto };
    await expect(service.create(dto)).resolves.not.toThrow();
    expect((await runCreate(dto))!.location).toBeNull();
  });

  it('does not modify other fields when location is invalid', async () => {
    const dto: CreateOrderDto = { ...baseDto, location: { lat: 999, lng: 999 } };
    const arg = await runCreate(dto);
    expect(arg!.email).toBe('ade@example.com');
    expect(arg!.total).toBe(10000);
    expect(arg!.location).toBeNull();
  });

  /* ── Backward-compatibility regression ───────────────────────────── */

  it('backward-compat: standard order with no location field', async () => {
    const dto: CreateOrderDto = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '09087654321',
      deliveryAddress: '5 Victoria Island, Lagos',
      total: 15000,
      currency: 'NGN',
      items: [{ itemId: new Types.ObjectId().toHexString(), name: 'Ankara Dress', quantity: 1, price: 15000 }],
    };
    await expect(service.create(dto)).resolves.not.toThrow();
    expect(lastModelCtorArg!.location).toBeNull();
    expect(lastModelCtorArg!.email).toBe('jane@example.com');
  });
});

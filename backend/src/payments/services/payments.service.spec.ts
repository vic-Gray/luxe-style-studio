import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { PaymentsService } from "./payments.service";
import { Order } from "@/orders/entities/order.entity";
import { Payment } from "../entities/payment.entity";
import axios from "axios";

describe("PaymentsService", () => {
  let service: PaymentsService;

  const mockOrder = {
    _id: new Types.ObjectId("507f1f77bcf86cd799439011"),
    email: "test@example.com",
    total: 5000,
    toString: () => "507f1f77bcf86cd799439011",
  } as unknown as Order;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getModelToken(Payment.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe("initializePayment", () => {
    it("should call Paystack with correct email, amount, and orderId", async () => {
      const mockAxiosResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "https://api.paystack.co/transaction/initialize" },
        data: {
          data: {
            reference: "paystack-ref-123",
            authorization_url: "https://paystack.com/pay/123",
          },
        },
      };

      jest.spyOn(axios, "post").mockResolvedValue(mockAxiosResponse);

      const result = await service.initializePayment(
        mockOrder.email,
        mockOrder.total,
        mockOrder._id.toString(),
      );

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/transaction/initialize"),
        {
          email: mockOrder.email,
          amount: mockOrder.total * 100,
          metadata: { orderId: mockOrder._id.toString() },
          callback_url: expect.stringContaining("/payment/callback"),
        },
        {
          headers: {
            Authorization: expect.stringContaining("Bearer"),
            "Content-Type": "application/json",
          },
        },
      );

      expect(result).toEqual(mockAxiosResponse);
    });

    it("should convert amount to kobo (multiply by 100)", async () => {
      const mockAxiosResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "https://api.paystack.co/transaction/initialize" },
        data: { data: { reference: "ref" } },
      };

      jest.spyOn(axios, "post").mockResolvedValue(mockAxiosResponse);

      await service.initializePayment("test@test.com", 1000, "order123");

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          amount: 100000,
        }),
        expect.any(Object),
      );
    });

    it("should throw if Paystack returns an error", async () => {
      jest
        .spyOn(axios, "post")
        .mockRejectedValue(new Error("Paystack API error"));

      await expect(
        service.initializePayment("test@test.com", 1000, "order123"),
      ).rejects.toThrow("Paystack API error");
    });
  });

  describe("verifyPayment", () => {
    it("should call Paystack verify endpoint with reference", async () => {
      const mockAxiosResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "https://api.paystack.co/transaction/verify/ref-123" },
        data: {
          status: true,
          data: {
            status: "success",
            reference: "ref-123",
            metadata: { orderId: "order123" },
          },
        },
      };

      jest.spyOn(axios, "get").mockResolvedValue(mockAxiosResponse);

      const result = await service.verifyPayment("ref-123");

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/transaction/verify/ref-123"),
        {
          headers: {
            Authorization: expect.stringContaining("Bearer"),
          },
        },
      );

      expect(result).toEqual(mockAxiosResponse.data);
    });

    it("should throw if Paystack verify returns an error", async () => {
      jest.spyOn(axios, "get").mockRejectedValue(new Error("Network error"));

      await expect(service.verifyPayment("ref-123")).rejects.toThrow(
        "Network error",
      );
    });
  });
});

import { Logger } from "@nestjs/common";
import { validateLocation } from "./orders.service";
import { LocationDto } from "../dto";

describe("validateLocation()", () => {
  let logger: Logger;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger("test");
    warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /* ── null / absent ───────────────────────────────────────────────── */

  it("returns null silently when location is null", () => {
    expect(validateLocation(null, logger)).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns null silently when location is undefined", () => {
    expect(validateLocation(undefined, logger)).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  /* ── valid ───────────────────────────────────────────────────────── */

  it("returns sanitized coords for a typical Lagos location", () => {
    const raw: LocationDto = { lat: 6.5244, lng: 3.3792, accuracy: 35 };
    expect(validateLocation(raw, logger)).toEqual({
      lat: 6.5244,
      lng: 3.3792,
      accuracy: 35,
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("accepts accuracy = 0", () => {
    const raw: LocationDto = { lat: -33.8688, lng: 151.2093, accuracy: 0 };
    expect(validateLocation(raw, logger)).toEqual({
      lat: -33.8688,
      lng: 151.2093,
      accuracy: 0,
    });
  });

  it("returns accuracy: null when accuracy is omitted", () => {
    expect(validateLocation({ lat: 6.5244, lng: 3.3792 }, logger)).toEqual({
      lat: 6.5244,
      lng: 3.3792,
      accuracy: null,
    });
  });

  it("accepts lat boundary -90", () => {
    expect(validateLocation({ lat: -90, lng: 0 }, logger)?.lat).toBe(-90);
  });

  it("accepts lat boundary 90", () => {
    expect(validateLocation({ lat: 90, lng: 0 }, logger)?.lat).toBe(90);
  });

  it("accepts lng boundary -180", () => {
    expect(validateLocation({ lat: 0, lng: -180 }, logger)?.lng).toBe(-180);
  });

  it("accepts lng boundary 180", () => {
    expect(validateLocation({ lat: 0, lng: 180 }, logger)?.lng).toBe(180);
  });

  /* ── invalid lat ─────────────────────────────────────────────────── */

  it("rejects when lat is undefined", () => {
    // Deliberately omit lat to simulate bad client data; cast tells TS this is intentional.
    const bad = { lng: 3.3792, accuracy: 35 } as unknown as LocationDto;
    expect(validateLocation(bad, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects lat > 90", () => {
    expect(validateLocation({ lat: 91, lng: 3.3792 }, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects lat < -90", () => {
    expect(validateLocation({ lat: -91, lng: 3.3792 }, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects NaN lat", () => {
    expect(validateLocation({ lat: NaN, lng: 3.3792 }, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects Infinity lat", () => {
    expect(validateLocation({ lat: Infinity, lng: 3.3792 }, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects string lat", () => {
    const bad = {
      lat: "6.5244" as unknown as number,
      lng: 3.3792,
    } as LocationDto;
    expect(validateLocation(bad, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  /* ── invalid lng ─────────────────────────────────────────────────── */

  it("rejects when lng is undefined", () => {
    const bad = { lat: 6.5244 } as unknown as LocationDto;
    expect(validateLocation(bad, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects lng > 180", () => {
    expect(validateLocation({ lat: 6.5244, lng: 181 }, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects lng < -180", () => {
    expect(validateLocation({ lat: 6.5244, lng: -181 }, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects NaN lng", () => {
    expect(validateLocation({ lat: 6.5244, lng: NaN }, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects string lng", () => {
    const bad = {
      lat: 6.5244,
      lng: "3.3792" as unknown as number,
    } as LocationDto;
    expect(validateLocation(bad, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  /* ── invalid accuracy ────────────────────────────────────────────── */

  it("rejects negative accuracy", () => {
    expect(
      validateLocation({ lat: 6.5244, lng: 3.3792, accuracy: -1 }, logger),
    ).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects NaN accuracy", () => {
    expect(
      validateLocation({ lat: 6.5244, lng: 3.3792, accuracy: NaN }, logger),
    ).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects Infinity accuracy", () => {
    expect(
      validateLocation(
        { lat: 6.5244, lng: 3.3792, accuracy: Infinity },
        logger,
      ),
    ).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects string accuracy", () => {
    const bad = {
      lat: 6.5244,
      lng: 3.3792,
      accuracy: "bad" as unknown as number,
    } as LocationDto;
    expect(validateLocation(bad, logger)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  /* ── extra keys / edge cases ─────────────────────────────────────── */

  it("ignores extra keys when coords are valid", () => {
    const raw = {
      lat: 6.5244,
      lng: 3.3792,
      accuracy: 35,
      extra: "junk",
    } as LocationDto;
    expect(validateLocation(raw, logger)).toEqual({
      lat: 6.5244,
      lng: 3.3792,
      accuracy: 35,
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not throw for an empty object", () => {
    const bad = {} as unknown as LocationDto;
    expect(() => validateLocation(bad, logger)).not.toThrow();
  });

  it("does not throw for a completely wrong type", () => {
    const bad = "not-an-object" as unknown as LocationDto;
    expect(() => validateLocation(bad, logger)).not.toThrow();
  });
});

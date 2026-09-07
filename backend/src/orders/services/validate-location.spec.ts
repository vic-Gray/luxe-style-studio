import { Logger } from '@nestjs/common';
import { validateLocation } from './orders.service';
import { LocationDto } from '../dto';

/**
 * Unit tests for the validateLocation() pure function.
 *
 * These tests do not touch Mongoose, the database, or any NestJS DI container.
 * They verify that:
 *  - Valid coordinates are accepted and returned sanitized.
 *  - null / undefined input is silently returned as null (majority case).
 *  - Out-of-range lat, lng, or accuracy values drop location to null and warn.
 *  - Wrong-type values (strings, NaN, Infinity) are rejected.
 *  - No location error ever throws — the return value is always null or a valid object.
 */
describe('validateLocation()', () => {
  // Shared logger stub — we only care about the warn call count in some tests,
  // so we spy rather than silence it completely.
  let logger: Logger;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger('test');
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /* ------------------------------------------------------------------ */
  /* NULL / ABSENT CASES — the majority of real traffic                   */
  /* ------------------------------------------------------------------ */

  it('returns null and does NOT warn when location is null', () => {
    expect(validateLocation(null, logger)).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns null and does NOT warn when location is undefined', () => {
    expect(validateLocation(undefined, logger)).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  /* ------------------------------------------------------------------ */
  /* VALID CASES                                                           */
  /* ------------------------------------------------------------------ */

  it('returns sanitized coordinates for a typical Lagos location', () => {
    const raw: LocationDto = { lat: 6.5244, lng: 3.3792, accuracy: 35 };
    const result = validateLocation(raw, logger);

    expect(result).toEqual({ lat: 6.5244, lng: 3.3792, accuracy: 35 });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns sanitized coordinates when accuracy is 0 (exact GPS fix)', () => {
    const raw: LocationDto = { lat: -33.8688, lng: 151.2093, accuracy: 0 };
    const result = validateLocation(raw, logger);

    expect(result).toEqual({ lat: -33.8688, lng: 151.2093, accuracy: 0 });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns sanitized coordinates with accuracy: null when accuracy is omitted', () => {
    const raw: LocationDto = { lat: 6.5244, lng: 3.3792 };
    const result = validateLocation(raw, logger);

    expect(result).toEqual({ lat: 6.5244, lng: 3.3792, accuracy: null });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('accepts boundary value lat = -90', () => {
    const result = validateLocation({ lat: -90, lng: 0 }, logger);
    expect(result).not.toBeNull();
    expect(result?.lat).toBe(-90);
  });

  it('accepts boundary value lat = 90', () => {
    const result = validateLocation({ lat: 90, lng: 0 }, logger);
    expect(result).not.toBeNull();
    expect(result?.lat).toBe(90);
  });

  it('accepts boundary value lng = -180', () => {
    const result = validateLocation({ lat: 0, lng: -180 }, logger);
    expect(result).not.toBeNull();
    expect(result?.lng).toBe(-180);
  });

  it('accepts boundary value lng = 180', () => {
    const result = validateLocation({ lat: 0, lng: 180 }, logger);
    expect(result).not.toBeNull();
    expect(result?.lng).toBe(180);
  });

  /* ------------------------------------------------------------------ */
  /* INVALID LAT VALUES                                                    */
  /* ------------------------------------------------------------------ */

  it('returns null and warns when lat is undefined', () => {
    const result = validateLocation({ lng: 3.3792, accuracy: 35 } as any, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when lat > 90', () => {
    const result = validateLocation({ lat: 91, lng: 3.3792 }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when lat < -90', () => {
    const result = validateLocation({ lat: -91, lng: 3.3792 }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when lat is NaN', () => {
    const result = validateLocation({ lat: NaN, lng: 3.3792 }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when lat is Infinity', () => {
    const result = validateLocation({ lat: Infinity, lng: 3.3792 }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when lat is a string', () => {
    const result = validateLocation({ lat: '6.5244' as any, lng: 3.3792 }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  /* ------------------------------------------------------------------ */
  /* INVALID LNG VALUES                                                    */
  /* ------------------------------------------------------------------ */

  it('returns null and warns when lng is undefined', () => {
    const result = validateLocation({ lat: 6.5244 } as any, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when lng > 180', () => {
    const result = validateLocation({ lat: 6.5244, lng: 181 }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when lng < -180', () => {
    const result = validateLocation({ lat: 6.5244, lng: -181 }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when lng is NaN', () => {
    const result = validateLocation({ lat: 6.5244, lng: NaN }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when lng is a string', () => {
    const result = validateLocation({ lat: 6.5244, lng: '3.3792' as any }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  /* ------------------------------------------------------------------ */
  /* INVALID ACCURACY VALUES                                               */
  /* ------------------------------------------------------------------ */

  it('returns null and warns when accuracy is negative', () => {
    const result = validateLocation({ lat: 6.5244, lng: 3.3792, accuracy: -1 }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when accuracy is NaN', () => {
    const result = validateLocation({ lat: 6.5244, lng: 3.3792, accuracy: NaN }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when accuracy is Infinity', () => {
    const result = validateLocation({ lat: 6.5244, lng: 3.3792, accuracy: Infinity }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null and warns when accuracy is a string', () => {
    const result = validateLocation({ lat: 6.5244, lng: 3.3792, accuracy: 'bad' as any }, logger);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  /* ------------------------------------------------------------------ */
  /* EXTRA UNEXPECTED KEYS — no crash, validated by class-validator       */
  /* We test that validateLocation itself is not confused by extras.      */
  /* ------------------------------------------------------------------ */

  it('ignores extra unexpected keys and returns valid location', () => {
    const raw = { lat: 6.5244, lng: 3.3792, accuracy: 35, extra: 'junk' } as any;
    const result = validateLocation(raw, logger);
    // Coordinates are valid; we return them (extra keys are ignored)
    expect(result).toEqual({ lat: 6.5244, lng: 3.3792, accuracy: 35 });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  /* ------------------------------------------------------------------ */
  /* SAFETY: function NEVER throws                                         */
  /* ------------------------------------------------------------------ */

  it('does not throw for an empty object', () => {
    expect(() => validateLocation({} as any, logger)).not.toThrow();
  });

  it('does not throw for a completely wrong type', () => {
    expect(() => validateLocation('not-an-object' as any, logger)).not.toThrow();
  });
});

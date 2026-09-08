import { describe, expect, it } from 'vitest';
import {
  buildOfficeInterval,
  getWorkdayInterval,
  intervalsOverlap,
  toApiIso,
} from '../../src/lib/time';

const now = new Date('2026-09-05T07:00:00.000Z');

describe('time boundaries', () => {
  it('serializes a local time with an offset', () => {
    expect(toApiIso('2026-09-10', '10:15', 'Europe/Moscow')).toMatch(
      /2026-09-10T10:15:00\.000\+03:00$/,
    );
  });

  it('rejects a duration that crosses 20:00', () => {
    expect(() =>
      buildOfficeInterval({
        date: '2026-09-10',
        startTime: '19:45',
        durationMinutes: 30,
        timezone: 'Europe/Moscow',
        now,
      }),
    ).toThrow();
  });

  it('accepts the last fifteen-minute workday slot', () => {
    const interval = buildOfficeInterval({
      date: '2026-09-10',
      startTime: '19:45',
      durationMinutes: 15,
      timezone: 'Europe/Moscow',
      now,
    });
    expect(interval.from).toMatch(/T19:45:00\.000\+03:00$/);
    expect(interval.to).toMatch(/T20:00:00\.000\+03:00$/);
  });

  it('rejects past, unaligned, and too-far starts', () => {
    for (const input of [
      { date: '2026-09-05', startTime: '10:00' },
      { date: '2026-09-10', startTime: '10:05' },
      { date: '2026-10-05', startTime: '10:15' },
    ]) {
      expect(() =>
        buildOfficeInterval({
          ...input,
          durationMinutes: 15,
          timezone: 'Europe/Moscow',
          now,
        }),
      ).toThrow();
    }
  });

  it('builds the complete local workday interval', () => {
    expect(getWorkdayInterval('2026-09-10', 'Europe/Moscow')).toEqual({
      from: '2026-09-10T09:00:00.000+03:00',
      to: '2026-09-10T20:00:00.000+03:00',
    });
  });

  it('does not treat equal endpoints as overlap', () => {
    expect(
      intervalsOverlap(
        { from: '2026-09-10T10:00:00.000Z', to: '2026-09-10T11:00:00.000Z' },
        { from: '2026-09-10T11:00:00.000Z', to: '2026-09-10T12:00:00.000Z' },
      ),
    ).toBe(false);
  });
});

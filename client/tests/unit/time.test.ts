import { describe, expect, it } from 'vitest';
import {
  buildOfficeInterval,
  getWorkdayInterval,
  intervalsOverlap,
  toApiIso,
} from '../../src/shared/lib/time';
import {
  getBookableDateBounds,
  getBookableTimeOptions,
  getDefaultRoomFilters,
  getNextSlot,
} from '../../src/entities/booking';
import { officeFixture } from '../support/handlers';

const now = new Date('2026-09-05T07:00:00.000Z');

describe('time boundaries', () => {
  it('limits calendar dates and start times by the exact office-local booking horizon', () => {
    const current = new Date('2026-09-05T07:00:00.000Z');
    expect(getBookableDateBounds('Europe/Moscow', current)).toEqual({
      min: '2026-09-05',
      max: '2026-10-05',
    });
    expect(getBookableTimeOptions('2026-10-05', 'Europe/Moscow', current)).toEqual([
      '09:00',
      '09:15',
      '09:30',
      '09:45',
      '10:00',
    ]);
  });

  it.each([
    ['2026-09-05T07:45:00.000Z', '2026-09-05', '11:00'],
    ['2026-09-05T15:46:00.000Z', '2026-09-05', '19:00'],
  ])('rounds %s to the next local quarter hour', (instant, date, startTime) => {
    expect(getNextSlot('Europe/Moscow', new Date(instant))).toEqual({ date, startTime });
  });

  it('keeps evening defaults within office hours and advances after closing', () => {
    expect(getDefaultRoomFilters(officeFixture, new Date('2026-09-05T16:01:00.000Z'))).toEqual({
      date: '2026-09-05',
      startTime: '19:15',
      duration: 45,
    });
    expect(getDefaultRoomFilters(officeFixture, new Date('2026-09-05T17:01:00.000Z'))).toEqual({
      date: '2026-09-06',
      startTime: '09:00',
      duration: 60,
    });
  });

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

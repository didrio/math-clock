import { alarmSchema, createAlarm, describeRepeat, formatAlarmTime, nextOccurrence } from './model';

describe('createAlarm', () => {
  it('fills in defaults and produces a valid alarm', () => {
    const alarm = createAlarm({ hour: 6, minute: 30 });
    expect(alarmSchema.parse(alarm)).toEqual(alarm);
    expect(alarm).toMatchObject({ hour: 6, minute: 30, enabled: true, problemCount: 3 });
  });

  it('gives every alarm its own id', () => {
    expect(createAlarm().id).not.toBe(createAlarm().id);
  });
});

describe('formatAlarmTime', () => {
  it('uses the locale clock style', () => {
    expect(formatAlarmTime({ hour: 7, minute: 5 }, 'en-US')).toBe('7:05 AM');
    expect(formatAlarmTime({ hour: 19, minute: 0 }, 'en-GB')).toBe('19:00');
  });
});

describe('describeRepeat', () => {
  it.each([
    [[], 'Once'],
    [[0, 1, 2, 3, 4, 5, 6], 'Every day'],
    [[5, 1, 2, 3, 4], 'Weekdays'],
    [[6, 0], 'Weekends'],
    [[0, 3, 1], 'Mon, Wed, Sun'],
  ])('%j → %s', (days, expected) => {
    expect(describeRepeat(days)).toBe(expected);
  });
});

describe('nextOccurrence', () => {
  // Wednesday 12 Nov 2025, 08:00 local time.
  const now = new Date(2025, 10, 12, 8, 0);

  it('rings later today when the time has not passed', () => {
    expect(nextOccurrence({ hour: 9, minute: 0, repeatDays: [] }, now)).toEqual(
      new Date(2025, 10, 12, 9, 0),
    );
  });

  it('rings tomorrow when the time has passed (or is now)', () => {
    expect(nextOccurrence({ hour: 8, minute: 0, repeatDays: [] }, now)).toEqual(
      new Date(2025, 10, 13, 8, 0),
    );
  });

  it('skips to the next repeat day', () => {
    // Weekends only → Saturday 15 Nov.
    expect(nextOccurrence({ hour: 7, minute: 30, repeatDays: [0, 6] }, now)).toEqual(
      new Date(2025, 10, 15, 7, 30),
    );
  });

  it('waits a full week when the only repeat day is today and the time has passed', () => {
    expect(nextOccurrence({ hour: 7, minute: 0, repeatDays: [3] }, now)).toEqual(
      new Date(2025, 10, 19, 7, 0),
    );
  });
});

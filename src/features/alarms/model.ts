import { z } from 'zod';

/** How hard the math is. See `src/features/challenge/problems.ts` for what each level generates. */
export const difficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof difficultySchema>;

/** Day of the week, 0 = Sunday … 6 = Saturday (same as `Date.getDay()`). */
const weekdaySchema = z.number().int().min(0).max(6);

/**
 * One alarm, as stored on the device. This is the full v1 shape: fields the editor doesn't expose
 * yet keep their defaults, so later features don't need a storage migration.
 */
export const alarmSchema = z.object({
  id: z.string(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  enabled: z.boolean(),
  label: z.string(),
  /** Days the alarm repeats on. Empty = rings once, at the next occurrence of the time. */
  repeatDays: z.array(weekdaySchema),
  difficulty: difficultySchema,
  /** How many problems must be solved to stop the alarm. */
  problemCount: z.number().int().min(1).max(10),
  /** Snooze length in minutes; 0 = snooze off. */
  snoozeMinutes: z.number().int().min(0).max(30),
  /** How many times one ring can be snoozed. */
  maxSnoozes: z.number().int().min(0).max(10),
  /** Ringtone identifier; sounds arrive with the native alarm engines. */
  soundId: z.string(),
});
export type Alarm = z.infer<typeof alarmSchema>;

export const alarmDefaults = {
  hour: 7,
  minute: 0,
  enabled: true,
  label: '',
  repeatDays: [],
  difficulty: 'medium',
  problemCount: 3,
  snoozeMinutes: 5,
  maxSnoozes: 1,
  soundId: 'default',
} as const satisfies Omit<Alarm, 'id'>;

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAlarm(fields: Partial<Omit<Alarm, 'id'>> = {}): Alarm {
  return { id: newId(), ...alarmDefaults, repeatDays: [], ...fields };
}

/** Sort key: time of day, earliest first. */
export function minutesOfDay(alarm: Pick<Alarm, 'hour' | 'minute'>): number {
  return alarm.hour * 60 + alarm.minute;
}

/** "7:05 AM" or "07:05", following the device locale. */
export function formatAlarmTime(alarm: Pick<Alarm, 'hour' | 'minute'>, locale?: string): string {
  const date = new Date(2000, 0, 1, alarm.hour, alarm.minute);
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Human summary of the repeat days: "Once", "Every day", "Weekdays", "Weekends" or "Mon, Wed". */
export function describeRepeat(days: readonly number[]): string {
  const set = new Set(days);
  if (set.size === 0) return 'Once';
  if (set.size === 7) return 'Every day';
  const has = (list: number[]) => list.length === set.size && list.every((d) => set.has(d));
  if (has([1, 2, 3, 4, 5])) return 'Weekdays';
  if (has([0, 6])) return 'Weekends';
  // Week starts on Monday in the summary.
  return [1, 2, 3, 4, 5, 6, 0]
    .filter((d) => set.has(d))
    .map((d) => dayNames[d])
    .join(', ');
}

/**
 * The next moment (strictly after `now`) this alarm should ring, ignoring `enabled`.
 * Uses local time, so it follows the device's time zone and daylight-saving changes.
 */
export function nextOccurrence(
  alarm: Pick<Alarm, 'hour' | 'minute' | 'repeatDays'>,
  now: Date,
): Date {
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      alarm.hour,
      alarm.minute,
    );
    if (candidate <= now) continue;
    if (alarm.repeatDays.length === 0 || alarm.repeatDays.includes(candidate.getDay())) {
      return candidate;
    }
  }
  // Unreachable: within 8 days every weekday occurs at least once after `now`.
  throw new Error('No next occurrence found');
}

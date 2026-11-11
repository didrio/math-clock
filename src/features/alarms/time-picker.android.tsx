import { DateTimePicker, Host } from '@expo/ui/jetpack-compose';

import { useTheme } from '@/theme';

import type { TimePickerProps } from './time-picker.types';

/** True when the device locale formats times on a 24-hour clock. */
function uses24HourClock(): boolean {
  try {
    const cycle = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions()
      .hourCycle;
    return cycle === 'h23' || cycle === 'h24';
  } catch {
    return false;
  }
}

/** Native Material 3 time picker (clock dial). */
export function TimePicker({ hour, minute, onChange }: TimePickerProps) {
  const theme = useTheme();
  return (
    <Host matchContents>
      <DateTimePicker
        displayedComponents="hourAndMinute"
        initialDate={new Date(2000, 0, 1, hour, minute).toISOString()}
        is24Hour={uses24HourClock()}
        color={theme.colors.primary}
        onDateSelected={(date) => {
          if (date) onChange(date.getHours(), date.getMinutes());
        }}
      />
    </Host>
  );
}

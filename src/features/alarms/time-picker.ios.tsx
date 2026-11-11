import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, labelsHidden } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/theme';

import type { TimePickerProps } from './time-picker.types';

/** Native SwiftUI wheel time picker (follows the device's 12/24-hour setting). */
export function TimePicker({ hour, minute, onChange }: TimePickerProps) {
  const theme = useTheme();
  return (
    <Host matchContents seedColor={theme.colors.primary}>
      <DatePicker
        selection={new Date(2000, 0, 1, hour, minute)}
        displayedComponents={['hourAndMinute']}
        onDateChange={(date) => onChange(date.getHours(), date.getMinutes())}
        modifiers={[datePickerStyle('wheel'), labelsHidden()]}
      />
    </Host>
  );
}

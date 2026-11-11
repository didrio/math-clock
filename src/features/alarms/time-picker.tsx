// Metro picks `time-picker.ios.tsx` / `time-picker.android.tsx` on device. This file only gives
// TypeScript a single module to resolve; both platform files share `TimePickerProps`.
export { TimePicker } from './time-picker.ios';
export type { TimePickerProps } from './time-picker.types';

import { Stack } from 'expo-router';

export default function AlarmsStackLayout() {
  return (
    <Stack screenOptions={{ headerLargeTitleEnabled: true }}>
      <Stack.Screen name="index" options={{ title: 'Alarms' }} />
    </Stack>
  );
}

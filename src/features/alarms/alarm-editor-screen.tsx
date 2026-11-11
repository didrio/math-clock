import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';

import { Button, ListSection, Screen, Text } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';

import { useAlarm, useAlarmsStore } from './alarms-store';
import { alarmDefaults } from './model';
import { TimePicker } from './time-picker';

/** Create (no `id` param) or edit (`?id=…`) an alarm. Presented as a modal. */
export function AlarmEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useAlarm(id);
  const isNew = !existing;

  const styles = useStyles();
  const theme = useTheme();
  const router = useRouter();
  const addAlarm = useAlarmsStore((state) => state.addAlarm);
  const updateAlarm = useAlarmsStore((state) => state.updateAlarm);
  const removeAlarm = useAlarmsStore((state) => state.removeAlarm);

  const [hour, setHour] = useState<number>(existing?.hour ?? alarmDefaults.hour);
  const [minute, setMinute] = useState<number>(existing?.minute ?? alarmDefaults.minute);
  const [label, setLabel] = useState(existing?.label ?? '');

  const save = () => {
    const fields = { hour, minute, label: label.trim() };
    if (existing) updateAlarm(existing.id, fields);
    else addAlarm(fields);
    router.back();
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Delete this alarm?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeAlarm(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen grouped>
      <Stack.Screen
        options={{
          title: isNew ? 'New alarm' : 'Edit alarm',
          headerLeft: () => <HeaderTextButton title="Cancel" onPress={() => router.back()} />,
          headerRight: () => <HeaderTextButton title="Save" bold onPress={save} />,
        }}
      />

      <View style={styles.picker}>
        <TimePicker
          hour={hour}
          minute={minute}
          onChange={(h, m) => {
            setHour(h);
            setMinute(m);
          }}
        />
      </View>

      <ListSection title="Label">
        <TextInput
          accessibilityLabel="Label"
          placeholder="Alarm"
          placeholderTextColor={theme.colors.textTertiary}
          value={label}
          onChangeText={setLabel}
          maxLength={40}
          returnKeyType="done"
          style={styles.input}
        />
      </ListSection>

      {existing ? (
        <Button title="Delete alarm" variant="destructive" onPress={confirmDelete} />
      ) : null}
    </Screen>
  );
}

function HeaderTextButton({
  title,
  bold,
  onPress,
}: {
  title: string;
  bold?: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress} style={styles.headerButton}>
      <Text variant={bold ? 'headline' : 'body'} color="primary">
        {title}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  picker: { alignItems: 'center' },
  input: {
    ...t.typography.body,
    color: t.colors.text,
    backgroundColor: t.colors.surface,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
    minHeight: 48,
  },
  headerButton: { paddingHorizontal: t.spacing.sm },
}));

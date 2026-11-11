import { Stack, useRouter } from 'expo-router';
import { Pressable, Switch, View } from 'react-native';

import { Button, Icon, ListSection, Screen, Text } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';

import { useAlarmsStore } from './alarms-store';
import { describeRepeat, formatAlarmTime, type Alarm } from './model';

export function AlarmsScreen() {
  const styles = useStyles();
  const router = useRouter();
  const alarms = useAlarmsStore((state) => state.alarms);

  const openEditor = (id?: string) =>
    router.push(id ? { pathname: '/alarm-editor', params: { id } } : '/alarm-editor');
  const practice = () =>
    router.push({ pathname: '/challenge', params: { difficulty: 'medium', count: '3' } });

  return (
    <Screen grouped>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New alarm"
              hitSlop={8}
              onPress={() => openEditor()}
              style={styles.headerButton}>
              <Icon name={{ ios: 'plus', android: 'add' }} size={22} color="primary" />
            </Pressable>
          ),
        }}
      />

      {alarms.length === 0 ? (
        <View style={styles.empty}>
          <Icon name={{ ios: 'alarm', android: 'alarm' }} size={56} color="primary" />
          <Text variant="title2" align="center">
            No alarms yet
          </Text>
          <Text color="textSecondary" align="center">
            Set an alarm, then solve a few math problems to turn it off.
          </Text>
          <Button
            title="Add alarm"
            icon={{ ios: 'plus', android: 'add' }}
            onPress={() => openEditor()}
          />
        </View>
      ) : (
        <ListSection footer="Alarms don't ring yet: the alarm engine arrives in a coming update.">
          {alarms.map((alarm) => (
            <AlarmRow key={alarm.id} alarm={alarm} onPress={() => openEditor(alarm.id)} />
          ))}
        </ListSection>
      )}

      <ListSection title="Practice" footer="Warm up with three problems. No alarm involved.">
        <View style={styles.practice}>
          <Button
            title="Practice"
            variant="secondary"
            icon={{ ios: 'function', android: 'calculate' }}
            onPress={practice}
          />
        </View>
      </ListSection>
    </Screen>
  );
}

function AlarmRow({ alarm, onPress }: { alarm: Alarm; onPress: () => void }) {
  const styles = useStyles();
  const theme = useTheme();
  const toggleAlarm = useAlarmsStore((state) => state.toggleAlarm);
  const time = formatAlarmTime(alarm);
  const details = [alarm.label, describeRepeat(alarm.repeatDays)].filter(Boolean).join(' · ');

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${time}, ${details}`}
        accessibilityHint="Edits the alarm"
        onPress={onPress}
        style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}>
        <Text variant="display" color={alarm.enabled ? 'text' : 'textTertiary'} style={styles.time}>
          {time}
        </Text>
        <Text variant="subheadline" color={alarm.enabled ? 'textSecondary' : 'textTertiary'}>
          {details}
        </Text>
      </Pressable>
      <Switch
        accessibilityLabel={`${time} alarm`}
        value={alarm.enabled}
        onValueChange={(enabled) => toggleAlarm(alarm.id, enabled)}
        trackColor={{ true: theme.colors.primary }}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  headerButton: { padding: t.spacing.xs },
  empty: {
    alignItems: 'center',
    gap: t.spacing.md,
    paddingVertical: t.spacing.xxxl,
    paddingHorizontal: t.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: t.spacing.lg,
  },
  rowMain: {
    flex: 1,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  rowPressed: { backgroundColor: t.colors.surfacePressed },
  time: { fontVariant: ['tabular-nums'] },
  practice: { padding: t.spacing.lg },
}));

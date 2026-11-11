import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components/ui';
import { difficultySchema, type Difficulty } from '@/features/alarms/model';
import { makeStyles } from '@/theme';

import { generateProblem, type Problem } from './problems';

const maxDigits = 6;

/**
 * Route: `/challenge?difficulty=medium&count=3[&alarmId=…]`. Without `alarmId` it's practice mode
 * (closable). With one, the alarm engine (T3/T4) opens it and it can only be left by solving.
 */
export function ChallengeScreen() {
  const params = useLocalSearchParams<{ difficulty?: string; count?: string; alarmId?: string }>();
  const router = useRouter();
  const difficulty = difficultySchema.catch('medium').parse(params.difficulty);
  const count = Math.min(10, Math.max(1, Number(params.count) || 3));
  const isPractice = !params.alarmId;

  return (
    <ChallengeView
      difficulty={difficulty}
      count={count}
      onClose={isPractice ? () => router.back() : undefined}
      onDone={() => router.back()}
    />
  );
}

export type ChallengeViewProps = {
  difficulty: Difficulty;
  count: number;
  /** Shows a close button when set (practice mode). */
  onClose?: () => void;
  /** Called from the "Done" button after every problem is solved. */
  onDone: () => void;
  /** Injectable randomness for deterministic tests. */
  random?: () => number;
};

export function ChallengeView({ difficulty, count, onClose, onDone, random }: ChallengeViewProps) {
  const styles = useStyles();
  const [problem, setProblem] = useState<Problem>(() => generateProblem(difficulty, random));
  const [solved, setSolved] = useState(0);
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);

  const done = solved >= count;

  const press = (digit: string) => {
    setWrong(false);
    setInput((current) => (current.length < maxDigits ? current + digit : current));
  };
  const backspace = () => setInput((current) => current.slice(0, -1));
  const submit = () => {
    if (input === '') return;
    if (Number(input) === problem.answer) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSolved((n) => n + 1);
      setWrong(false);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrong(true);
    }
    setInput('');
    setProblem(generateProblem(difficulty, random));
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <Text variant="headline" color="textSecondary">
          {done ? 'All done' : `Problem ${solved + 1} of ${count}`}
        </Text>
        {onClose ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
            onPress={onClose}
            style={styles.close}>
            <Icon name={{ ios: 'xmark', android: 'close' }} size={18} color="textSecondary" />
          </Pressable>
        ) : null}
      </View>

      {done ? (
        <View style={styles.center}>
          <Icon
            name={{ ios: 'checkmark.circle.fill', android: 'check_circle' }}
            size={72}
            color="success"
          />
          <Text variant="largeTitle" align="center" accessibilityRole="header">
            Solved!
          </Text>
          <Text color="textSecondary" align="center">
            Your brain is awake. Have a great day.
          </Text>
          <Button title="Done" onPress={onDone} style={styles.doneButton} />
        </View>
      ) : (
        <>
          <View style={styles.center}>
            <Text
              variant="display"
              align="center"
              style={styles.numbers}
              accessibilityRole="header">
              {problem.text}
            </Text>
            <View style={[styles.answer, wrong && styles.answerWrong]}>
              <Text
                variant="display"
                color={input ? 'text' : 'textTertiary'}
                align="center"
                style={styles.numbers}
                accessibilityLabel={input ? `Your answer: ${input}` : 'No answer yet'}>
                {input || '?'}
              </Text>
            </View>
            <Text color="danger" align="center" style={!wrong && styles.hidden}>
              Not quite. Here&apos;s a new one.
            </Text>
          </View>
          <Keypad
            onDigit={press}
            onBackspace={backspace}
            onSubmit={submit}
            canSubmit={input !== ''}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function Keypad({
  onDigit,
  onBackspace,
  onSubmit,
  canSubmit,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
}) {
  const styles = useStyles();
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];
  return (
    <View style={styles.keypad}>
      {rows.map((row) => (
        <View key={row.join()} style={styles.keyRow}>
          {row.map((digit) => (
            <Key key={digit} label={digit} onPress={() => onDigit(digit)}>
              <Text variant="title" style={styles.numbers}>
                {digit}
              </Text>
            </Key>
          ))}
        </View>
      ))}
      <View style={styles.keyRow}>
        <Key label="Delete" onPress={onBackspace}>
          <Icon name={{ ios: 'delete.left', android: 'backspace' }} size={26} />
        </Key>
        <Key label="0" onPress={() => onDigit('0')}>
          <Text variant="title" style={styles.numbers}>
            0
          </Text>
        </Key>
        <Key label="Submit" onPress={onSubmit} primary disabled={!canSubmit}>
          <Icon name={{ ios: 'checkmark', android: 'check' }} size={26} color="onPrimary" />
        </Key>
      </View>
    </View>
  );
}

function Key({
  label,
  onPress,
  primary,
  disabled,
  children,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.key,
        primary && styles.keyPrimary,
        pressed && styles.keyPressed,
        disabled && styles.keyDisabled,
      ]}>
      {children}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background, paddingHorizontal: t.spacing.lg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: t.spacing.md,
    minHeight: 44,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: t.spacing.lg },
  numbers: { fontVariant: ['tabular-nums'] },
  answer: {
    minWidth: 160,
    paddingHorizontal: t.spacing.xl,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.lg,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: t.colors.border,
  },
  answerWrong: { borderColor: t.colors.danger },
  hidden: { opacity: 0 },
  doneButton: { alignSelf: 'stretch', marginTop: t.spacing.lg },
  keypad: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: t.spacing.md,
    paddingBottom: t.spacing.lg,
  },
  keyRow: { flexDirection: 'row', gap: t.spacing.md },
  key: {
    flex: 1,
    height: 64,
    borderRadius: t.radius.lg,
    borderCurve: 'continuous',
    backgroundColor: t.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPrimary: { backgroundColor: t.colors.primary },
  keyPressed: { opacity: 0.6 },
  keyDisabled: { opacity: 0.4 },
}));

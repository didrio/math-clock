import { act, fireEvent, userEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import { ChallengeScreen } from '@/features/challenge/challenge-screen';

import { AlarmEditorScreen } from './alarm-editor-screen';
import { AlarmsScreen } from './alarms-screen';
import { useAlarmsStore } from './alarms-store';

function renderApp() {
  return renderRouter(
    {
      _layout: () => <Stack />,
      index: AlarmsScreen,
      'alarm-editor': AlarmEditorScreen,
      challenge: ChallengeScreen,
    },
    { initialUrl: '/' },
  );
}

beforeEach(() => {
  useAlarmsStore.setState({ alarms: [] });
});

describe('AlarmsScreen', () => {
  it('starts empty, then adds an alarm with a label', async () => {
    const user = userEvent.setup();
    await renderApp();
    expect(screen.getByText('No alarms yet')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Add alarm' }));
    await user.type(screen.getByLabelText('Label'), 'Gym');
    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('button', { name: '7:00 AM, Gym · Once' })).toBeOnTheScreen();
    expect(screen.queryByText('No alarms yet')).not.toBeOnTheScreen();
  });

  it('turns an alarm off with its switch', async () => {
    useAlarmsStore.getState().addAlarm({ hour: 6, minute: 30 });
    await renderApp();

    const toggle = screen.getByRole('switch', { name: '6:30 AM alarm' });
    expect(toggle).toBeChecked();
    // userEvent can't flip a Switch; fire its change event directly.
    await fireEvent(toggle, 'valueChange', false);
    expect(useAlarmsStore.getState().alarms[0]?.enabled).toBe(false);
  });

  it('edits and deletes an alarm', async () => {
    const user = userEvent.setup();
    const alert = jest.spyOn(Alert, 'alert');
    useAlarmsStore.getState().addAlarm({ hour: 6, minute: 30, label: 'Run' });
    await renderApp();

    await user.press(screen.getByRole('button', { name: '6:30 AM, Run · Once' }));
    await user.clear(screen.getByLabelText('Label'));
    await user.type(screen.getByLabelText('Label'), 'Swim');
    await user.press(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('button', { name: '6:30 AM, Swim · Once' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: '6:30 AM, Swim · Once' }));
    await user.press(screen.getByRole('button', { name: 'Delete alarm' }));
    const buttons = alert.mock.calls[0]?.[2];
    await act(async () => buttons?.find((b) => b.text === 'Delete')?.onPress?.());

    expect(await screen.findByText('No alarms yet')).toBeOnTheScreen();
  });

  it('opens a practice challenge', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.press(screen.getByRole('button', { name: 'Practice' }));
    expect(await screen.findByText('Problem 1 of 3')).toBeOnTheScreen();
  });
});

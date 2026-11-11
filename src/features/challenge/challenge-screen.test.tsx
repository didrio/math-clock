import { render, screen, userEvent } from '@testing-library/react-native';

import { ChallengeView } from './challenge-screen';

// random() = 0 makes every medium problem "3 × 3" (= 9).
const random = () => 0;

async function answer(user: ReturnType<typeof userEvent.setup>, digits: string) {
  for (const digit of digits) {
    await user.press(screen.getByRole('button', { name: digit }));
  }
  await user.press(screen.getByRole('button', { name: 'Submit' }));
}

describe('ChallengeView', () => {
  it('requires every problem to be solved, then finishes', async () => {
    const user = userEvent.setup();
    const onDone = jest.fn();
    await render(<ChallengeView difficulty="medium" count={2} onDone={onDone} random={random} />);

    expect(screen.getByText('Problem 1 of 2')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: '3 × 3' })).toBeOnTheScreen();

    await answer(user, '9');
    expect(screen.getByText('Problem 2 of 2')).toBeOnTheScreen();

    await answer(user, '9');
    expect(screen.getByRole('header', { name: 'Solved!' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Done' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('does not count a wrong answer', async () => {
    const user = userEvent.setup();
    await render(
      <ChallengeView difficulty="medium" count={1} onDone={jest.fn()} random={random} />,
    );

    await answer(user, '12');
    expect(screen.getByText('Problem 1 of 1')).toBeOnTheScreen();
    expect(screen.getByText("Not quite. Here's a new one.")).toBeVisible();
  });

  it('lets the user fix a typo before submitting', async () => {
    const user = userEvent.setup();
    await render(
      <ChallengeView difficulty="medium" count={1} onDone={jest.fn()} random={random} />,
    );

    await user.press(screen.getByRole('button', { name: '8' }));
    expect(screen.getByLabelText('Your answer: 8')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();

    await answer(user, '9');
    expect(screen.getByRole('header', { name: 'Solved!' })).toBeOnTheScreen();
  });

  it('can be closed only in practice mode', async () => {
    const onClose = jest.fn();
    const { rerender } = await render(
      <ChallengeView difficulty="easy" count={1} onDone={jest.fn()} onClose={onClose} />,
    );
    await userEvent.setup().press(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await rerender(<ChallengeView difficulty="easy" count={1} onDone={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeOnTheScreen();
  });
});

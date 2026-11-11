import { storage } from '@/lib/storage';

import { useAlarmsStore } from './alarms-store';

const store = () => useAlarmsStore.getState();

beforeEach(() => {
  useAlarmsStore.setState({ alarms: [] });
});

describe('useAlarmsStore', () => {
  it('adds alarms sorted by time of day', () => {
    store().addAlarm({ hour: 9, minute: 0 });
    store().addAlarm({ hour: 6, minute: 45 });
    expect(store().alarms.map((a) => [a.hour, a.minute])).toEqual([
      [6, 45],
      [9, 0],
    ]);
  });

  it('updates, toggles and removes an alarm', () => {
    const { id } = store().addAlarm({ hour: 7, minute: 0 });

    store().updateAlarm(id, { label: 'Gym', minute: 15 });
    expect(store().alarms[0]).toMatchObject({ label: 'Gym', minute: 15 });

    store().toggleAlarm(id, false);
    expect(store().alarms[0]?.enabled).toBe(false);

    store().removeAlarm(id);
    expect(store().alarms).toEqual([]);
  });

  it('persists alarms to storage', () => {
    store().addAlarm({ hour: 5, minute: 30, label: 'Run' });
    const saved = JSON.parse(storage.getString('alarms') ?? '{}');
    expect(saved.state.alarms[0]).toMatchObject({ hour: 5, minute: 30, label: 'Run' });
  });

  it('ignores stored data that does not match the schema', async () => {
    storage.setString('alarms', JSON.stringify({ state: { alarms: [{ hour: 'x' }] }, version: 1 }));
    await useAlarmsStore.persist.rehydrate();
    expect(store().alarms).toEqual([]);
  });
});

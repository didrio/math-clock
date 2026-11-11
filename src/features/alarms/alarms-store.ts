import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';

import { alarmSchema, createAlarm, minutesOfDay, type Alarm } from './model';

type AlarmsState = {
  alarms: Alarm[];
  /** Creates an alarm from the given fields (defaults for the rest) and returns it. */
  addAlarm: (fields?: Partial<Omit<Alarm, 'id'>>) => Alarm;
  updateAlarm: (id: string, fields: Partial<Omit<Alarm, 'id'>>) => void;
  removeAlarm: (id: string) => void;
  toggleAlarm: (id: string, enabled: boolean) => void;
};

const persistedSchema = z.object({ alarms: z.array(alarmSchema) });

function sortAlarms(alarms: Alarm[]): Alarm[] {
  return [...alarms].sort((a, b) => minutesOfDay(a) - minutesOfDay(b));
}

/**
 * The user's alarms, kept on the device and sorted by time of day.
 * The native alarm engines (iOS AlarmKit / Android AlarmManager) will mirror this store.
 */
export const useAlarmsStore = create<AlarmsState>()(
  persist(
    (set) => ({
      alarms: [],
      addAlarm: (fields) => {
        const alarm = createAlarm(fields);
        set((state) => ({ alarms: sortAlarms([...state.alarms, alarm]) }));
        return alarm;
      },
      updateAlarm: (id, fields) =>
        set((state) => ({
          alarms: sortAlarms(state.alarms.map((a) => (a.id === id ? { ...a, ...fields } : a))),
        })),
      removeAlarm: (id) => set((state) => ({ alarms: state.alarms.filter((a) => a.id !== id) })),
      toggleAlarm: (id, enabled) =>
        set((state) => ({
          alarms: state.alarms.map((a) => (a.id === id ? { ...a, enabled } : a)),
        })),
    }),
    {
      name: 'alarms',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ alarms: state.alarms }),
      // Drop stored data that doesn't match the schema instead of crashing on it.
      merge: (persisted, current) => {
        const parsed = persistedSchema.safeParse(persisted);
        return parsed.success ? { ...current, alarms: sortAlarms(parsed.data.alarms) } : current;
      },
    },
  ),
);

export function useAlarm(id: string | undefined): Alarm | undefined {
  return useAlarmsStore((state) => state.alarms.find((a) => a.id === id));
}

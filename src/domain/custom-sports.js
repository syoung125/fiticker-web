import { validateRecord } from './workouts.js';

export const CUSTOM_SPORTS_KEY = 'move-diary.custom-sports.v1';
export function loadCustomSports(storage) {
  try {
    const values = JSON.parse((storage ?? globalThis.localStorage).getItem(CUSTOM_SPORTS_KEY));
    if (!Array.isArray(values)) return [];
    const sports = new Map();
    for (const value of values) {
      try {
        const record = validateRecord({ type: 'other', name: value.name, icon: value.icon });
        sports.set(record.name, { name: record.name, icon: record.icon ?? '✳️' });
      } catch {
        /* Ignore invalid saved items. */
      }
    }
    return [...sports.values()];
  } catch {
    return [];
  }
}
export function rememberCustomSport(sports, record, storage) {
  const checked = validateRecord({ type: 'other', name: record.name, icon: record.icon });
  const sport = { name: checked.name, icon: checked.icon ?? '✳️' };
  const index = sports.findIndex((item) => item.name === sport.name);
  if (index < 0) sports.push(sport);
  else sports[index] = sport;
  try {
    (storage ?? globalThis.localStorage).setItem(CUSTOM_SPORTS_KEY, JSON.stringify(sports));
    return true;
  } catch {
    return false;
  }
}

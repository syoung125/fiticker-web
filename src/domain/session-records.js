import { TYPES, validateRecord } from './workouts.js';

export const SESSION_KEY = 'move-diary.records.v1';
export function loadSessionRecords(storage) {
  const records = Object.create(null);
  try {
    const data = JSON.parse((storage ?? globalThis.sessionStorage).getItem(SESSION_KEY));
    if (!data || typeof data !== 'object' || Array.isArray(data)) return records;
    for (const [key, record] of Object.entries(data)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !record || !Object.hasOwn(TYPES, record.type))
        continue;
      const minutes = record.minutes;
      if (minutes !== null && (!Number.isInteger(minutes) || minutes < 0 || minutes > 1439))
        continue;
      try {
        records[key] = {
          ...validateRecord({
            type: record.type,
            name: record.name,
            hours: minutes === null ? '' : String(Math.floor(minutes / 60)),
            mins: minutes === null ? '' : String(minutes % 60),
            memo: record.memo,
          }),
          photo: null,
        };
      } catch {
        /* Ignore one invalid saved record without losing valid dates. */
      }
    }
  } catch {
    /* A blocked storage API or corrupt cache must not prevent recording. */
  }
  return records;
}
export function saveSessionRecords(records, storage) {
  try {
    (storage ?? globalThis.sessionStorage).setItem(SESSION_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

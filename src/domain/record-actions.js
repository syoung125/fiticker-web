import { validateRecord } from './workouts.js';

// Each sheet updates only its own field; all other saved details survive.
export function updateRecord(record, action, data = {}) {
  if (action === 'type') {
    const selected = validateRecord({ type: data.type, name: data.name });
    return { ...selected, photo: null, ...record, type: selected.type, name: selected.name };
  }
  if (!record) throw new Error('먼저 운동을 선택해 주세요.');
  if (action === 'edit') {
    const checked = validateRecord(data);
    return { ...record, type: checked.type, name: checked.name, minutes: checked.minutes };
  }
  if (action === 'photo') return { ...record, photo: data.photo ?? null };
  if (action === 'time') {
    const checked = validateRecord({ type: record.type, name: record.name, ...data });
    return { ...record, minutes: checked.minutes };
  }
  if (action === 'memo') {
    const checked = validateRecord({ type: record.type, name: record.name, memo: data.memo });
    return { ...record, memo: checked.memo };
  }
  throw new Error('지원하지 않는 작업이에요.');
}

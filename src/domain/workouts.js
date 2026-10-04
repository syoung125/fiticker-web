export const TYPES = {
  crossfit: { label: 'CrossFit', ko: '크로스핏', icon: '🏋️', color: '#e7e1f6' },
  yoga: { label: 'Yoga', ko: '요가', icon: '🧘', color: '#e9e4f3' },
  running: { label: 'Running', ko: '러닝', icon: '🏃', color: '#dfff7a' },
  cycling: { label: 'Cycling', ko: '사이클', icon: '🚴', color: '#e1ebdc' },
  swimming: { label: 'Swimming', ko: '수영', icon: '🏊', color: '#dfeaf2' },
  weight: { label: 'Weight', ko: '웨이트', icon: '💪', color: '#ece6dd' },
  pilates: { label: 'Pilates', ko: '필라테스', icon: '🤸', color: '#f0e0e4' },
  ballet: { label: 'Ballet', ko: '발레', icon: '🩰', color: '#f0e0e4' },
  climbing: { label: 'Climbing', ko: '클라이밍', icon: '🧗', color: '#ece6dd' },
  tennis: { label: 'Tennis', ko: '테니스', icon: '🎾', color: '#dfff7a' },
  soccer: { label: 'Soccer', ko: '축구', icon: '⚽', color: '#e1ebdc' },
  other: { label: 'Other', ko: '기타', icon: '✳', color: '#e9e8df' },
};
export function validEmoji(value) {
  if (typeof value !== 'string' || value.length > 32) return false;
  const parts = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)];
  return (
    parts.length === 1 && /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(value)
  );
}
export function recordIcon(record) {
  return record.type === 'other' && validEmoji(record.icon) ? record.icon : TYPES[record.type].icon;
}
export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function weekDates(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from(
    { length: 7 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12),
  );
}
export function navigateWeek(start, offset, now = new Date()) {
  const target = new Date(start);
  target.setDate(target.getDate() + offset * 7);
  const dates = weekDates(target);
  const current = weekDates(now);
  return dates[0] > current[0] ? current : dates;
}
export function weekLabel(start) {
  const thu = weekDates(start)[3];
  return `${thu.getFullYear()}년 ${thu.getMonth() + 1}월 ${Math.ceil(thu.getDate() / 7)}주`;
}
export function weekNumber(start) {
  const thu = weekDates(start)[3];
  const jan4 = weekDates(new Date(thu.getFullYear(), 0, 4))[3];
  return 1 + Math.round((thu - jan4) / 604800000);
}
export function summarize(dates, records) {
  return dates.reduce(
    (s, d) => {
      const r = records[dateKey(d)];
      if (r) {
        s.count++;
        s.minutes += r.minutes || 0;
      }
      return s;
    },
    { count: 0, minutes: 0 },
  );
}
export function summarizeBySport(dates, records) {
  const groups = new Map();
  for (const day of dates) {
    const record = records[dateKey(day)];
    if (!record) continue;
    const name = record.type === 'other' ? record.name.trim() : TYPES[record.type].label;
    const key = record.type === 'other' ? `other:${name}` : record.type;
    if (!groups.has(key)) groups.set(key, { name, minutes: null });
    if (record.minutes != null) {
      const group = groups.get(key);
      group.minutes = (group.minutes ?? 0) + record.minutes;
    }
  }
  return [...groups.values()];
}
export function duration(m) {
  return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`;
}
export function validateRecord({ type, name = '', hours = '', mins = '', memo = '', icon }) {
  if (!TYPES[type]) throw new Error('운동 종류를 선택해 주세요.');
  if (type === 'other' && !name.trim()) throw new Error('운동 이름을 입력해 주세요.');
  const h = Number(hours),
    m = Number(mins);
  if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(m) || m < 0 || m > 59)
    throw new Error('시간은 0~23, 분은 0~59로 입력해 주세요.');
  if (Array.from(memo).length > 30) throw new Error('메모는 30자까지 입력할 수 있어요.');
  if (Array.from(name.trim()).length > 20) throw new Error('운동 이름은 20자까지 입력해 주세요.');
  if (type === 'other' && icon !== undefined && !validEmoji(icon))
    throw new Error('이모지 하나를 선택해 주세요.');
  return {
    ...(type === 'other' && icon !== undefined ? { icon } : {}),
    type,
    name: type === 'other' ? name.trim() : TYPES[type].label,
    minutes: hours === '' && mins === '' ? null : h * 60 + m,
    memo: memo.trim(),
  };
}

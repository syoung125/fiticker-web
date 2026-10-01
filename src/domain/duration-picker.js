// Keep this in sync with --wheel-row-height in the picker stylesheet.
export const WHEEL_ROW_HEIGHT = 40;

export function minuteOptions(selectedMinute) {
  const values = Array.from({ length: 12 }, (_, index) => index * 5);
  // Older records may contain any minute value; editing must not round it away.
  if (Number.isInteger(selectedMinute) && selectedMinute >= 0 && selectedMinute < 60) {
    if (!values.includes(selectedMinute)) values.push(selectedMinute);
  }
  return values.sort((a, b) => a - b);
}

export function splitDuration(total) {
  return {
    hours: total == null ? 0 : Math.floor(total / 60),
    minutes: total == null ? 0 : total % 60,
    entered: total != null,
  };
}

export function wheelIndex(scrollTop, count) {
  return Math.max(0, Math.min(count - 1, Math.round(scrollTop / WHEEL_ROW_HEIGHT)));
}

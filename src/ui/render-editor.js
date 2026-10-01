import { TYPES, DAYS, dateKey, weekLabel, weekDates, duration } from '../domain/workouts.js';
import { $, el } from './dom.js';
import { summaryModel } from '../media/summary.js';
import { renderSummary } from './render-summary.js';

export function renderEditor({ dates, records, onEdit }) {
  $('#next').disabled = dates[0] >= weekDates(new Date())[0];
  $('#week-title').textContent = weekLabel(dates[0]);
  $('#date-range').textContent =
    `${dateKey(dates[0]).replaceAll('-', '.')} — ${dateKey(dates[6]).replaceAll('-', '.')}`;
  renderSummary($('#summary-canvas'), summaryModel(dates, records));
  $('#calendar').replaceChildren();
  dates.forEach((date, index) => {
    const key = dateKey(date),
      record = records[key];
    const cell = el('div', 'calendar-day');
    const button = el('button', `day${key === dateKey(new Date()) ? ' is-today' : ''}`);
    button.type = 'button';
    button.dataset.date = key;
    button.setAttribute(
      'aria-label',
      `${date.getMonth() + 1}월 ${date.getDate()}일 ${record ? record.name + ' 종목 변경' : '운동 추가'}`,
    );
    if (key === dateKey(new Date())) button.setAttribute('aria-current', 'date');
    button.append(
      el('span', 'weekday', DAYS[index]),
      el('span', 'date', date.getDate()),
      el('span', record ? 'day-icon' : 'day-icon plus', record ? TYPES[record.type].icon : '＋'),
    );
    button.onclick = () => onEdit(date, 'type');
    cell.append(button);
    if (record) {
      const time = el(
        'button',
        'day-time',
        record.minutes === null ? '시간 입력' : duration(record.minutes),
      );
      time.type = 'button';
      time.setAttribute(
        'aria-label',
        `${date.getMonth() + 1}월 ${date.getDate()}일 운동 시간 ${record.minutes === null ? '입력' : '수정'}`,
      );
      time.onclick = () => onEdit(date, 'time');
      cell.append(time);
    }
    $('#calendar').append(cell);
  });
}

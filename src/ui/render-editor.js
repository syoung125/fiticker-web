import { TYPES, DAYS, dateKey, weekLabel, weekDates, duration } from '../domain/workouts.js';
import { $, el } from './dom.js';
import { summaryModel } from '../media/summary.js';
import { renderSummary } from './render-summary.js';

function detailButton(className, value, placeholder) {
  const button = el('button', `day-detail ${className}`);
  if (value == null || value === '') {
    const ns = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(ns, 'svg');
    for (const [key, value] of Object.entries({
      viewBox: '0 0 12 12',
      width: '10',
      height: '10',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    }))
      icon.setAttribute(key, value);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M6 2v8M2 6h8');
    icon.append(path);
    button.append(icon);
  }
  button.append(
    el('span', 'day-detail-label', value == null || value === '' ? placeholder : value),
  );
  return button;
}

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
      `${date.getMonth() + 1}월 ${date.getDate()}일 ${record ? record.name + ' 기록 편집' : '운동 추가'}`,
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
      const time = detailButton(
        'day-time',
        record.minutes == null ? null : duration(record.minutes),
        '시간',
      );
      time.type = 'button';
      time.dataset.recordAction = 'time';
      time.dataset.recordDate = key;
      time.setAttribute('aria-label', `${date.getMonth() + 1}월 ${date.getDate()}일 시간 설정`);
      time.onclick = () => onEdit(date, 'time');
      const memo = detailButton('day-memo', record.memo, '메모');
      memo.type = 'button';
      memo.dataset.recordAction = 'memo';
      memo.dataset.recordDate = key;
      memo.title = record.memo || '메모 추가';
      memo.setAttribute(
        'aria-label',
        `${date.getMonth() + 1}월 ${date.getDate()}일 메모 ${record.memo ? '편집: ' + record.memo : '추가'}`,
      );
      memo.onclick = () => onEdit(date, 'memo');
      cell.append(time, memo);
    }
    $('#calendar').append(cell);
  });
}

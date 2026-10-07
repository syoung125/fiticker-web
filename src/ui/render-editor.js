import {
  dayRecords,
  recordIcon,
  DAYS,
  dateKey,
  weekLabel,
  weekDates,
  duration,
} from '../domain/workouts.js';
import { $, el } from './dom.js';
import { summaryModel } from '../media/summary.js';
import { renderSummary } from './render-summary.js';

function detailButton(className, value, placeholder) {
  const empty = value == null || value === '';
  const button = el('button', `day-detail ${className}${empty ? ' is-empty' : ''}`);
  const content = el('span', 'day-detail-content');
  if (empty) {
    const ns = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(ns, 'svg');
    for (const [key, value] of Object.entries({
      viewBox: '0 0 12 12',
      width: '10',
      height: '10',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.2',
      'stroke-linecap': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    }))
      icon.setAttribute(key, value);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M6 2v8M2 6h8');
    icon.append(path);
    content.append(icon);
  }
  content.append(el('span', 'day-detail-label', empty ? placeholder : value));
  button.append(content);
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
    const key = dateKey(date);
    const items = dayRecords(records, key);
    const label = `${date.getMonth() + 1}월 ${date.getDate()}일`;
    const cell = el('div', 'calendar-day');
    const heading = el(
      'button',
      `day day-heading${key === dateKey(new Date()) ? ' is-today' : ''}`,
    );
    heading.type = 'button';
    heading.dataset.date = key;
    heading.setAttribute('aria-label', `${label} 운동 추가`);
    if (key === dateKey(new Date())) heading.setAttribute('aria-current', 'date');
    heading.append(el('span', 'weekday', DAYS[index]), el('span', 'date', date.getDate()));
    heading.onclick = () => onEdit(date, 'type', -1);
    cell.append(heading);
    items.forEach((record, recordIndex) => {
      const group = el('div', 'day-session');
      const button = el('button', 'day-session-icon');
      button.type = 'button';
      button.textContent = recordIcon(record);
      button.setAttribute('aria-label', `${label} ${recordIndex + 1}번째 ${record.name} 기록 편집`);
      button.onclick = () => onEdit(date, 'type', recordIndex);
      group.append(button);
      for (const [action, value, placeholder] of [
        ['time', record.minutes == null ? null : duration(record.minutes), '시간'],
        ['memo', record.memo, '메모'],
      ]) {
        const detail = detailButton(`day-${action}`, value, placeholder);
        detail.type = 'button';
        detail.dataset.recordAction = action;
        detail.dataset.recordDate = key;
        detail.dataset.recordIndex = String(recordIndex);
        detail.setAttribute(
          'aria-label',
          `${label} ${recordIndex + 1}번째 ${record.name} ${placeholder} 설정`,
        );
        detail.onclick = () => onEdit(date, action, recordIndex);
        group.append(detail);
      }
      cell.append(group);
    });
    const add = el('button', 'day-add', '＋');
    add.type = 'button';
    add.setAttribute('aria-label', `${label} 운동 추가`);
    add.onclick = () => onEdit(date, 'type', -1);
    cell.append(add);
    $('#calendar').append(cell);
  });
}

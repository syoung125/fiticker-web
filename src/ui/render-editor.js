import { TYPES, DAYS, dateKey, weekLabel, summarize, duration } from '../domain/workouts.js';
import { $, el } from './dom.js';
export function renderEditor({ dates, records, generating, onEdit }) {
  $('#week-title').textContent = weekLabel(dates[0]);
  $('#date-range').textContent =
    `${dateKey(dates[0]).replaceAll('-', '.')} — ${dateKey(dates[6]).replaceAll('-', '.')}`;
  const { count, minutes } = summarize(dates, records);
  $('#count').textContent = count;
  $('#total').replaceChildren();
  const chunks = duration(minutes).match(/\d+|[hm]/g);
  chunks.forEach((p) =>
    $('#total').append(/[hm]/.test(p) ? el('small', '', p + ' ') : document.createTextNode(p)),
  );
  $('#mini-count').textContent = count;
  $('#mini-time').textContent = duration(minutes);
  $('#record-count').textContent = String(count).padStart(2, '0');
  $('#generate').disabled = generating || count === 0;
  $('#generate-hint').textContent = count
    ? '내 기록으로 만든, 나만의 주간 이미지.'
    : '운동을 하나 이상 기록하면 만들 수 있어요.';
  $('#calendar').replaceChildren();
  $('#records').replaceChildren();
  $('#mini-week').replaceChildren();
  dates.forEach((date, i) => {
    const key = dateKey(date),
      r = records[key];
    const button = el(
      'button',
      `day${r ? ' has-record' : ''}${key === dateKey(new Date()) ? ' is-today' : ''}`,
    );
    button.type = 'button';
    button.setAttribute(
      'aria-label',
      `${date.getMonth() + 1}월 ${date.getDate()}일 ${r ? r.name + ' 수정' : '운동 추가'}`,
    );
    if (key === dateKey(new Date())) button.setAttribute('aria-current', 'date');
    button.append(
      el('span', 'weekday', DAYS[i]),
      el('span', 'date', date.getDate()),
      el('span', r ? 'day-icon' : 'day-icon plus', r ? TYPES[r.type].icon : '＋'),
    );
    button.onclick = () => onEdit(date);
    $('#calendar').append(button);
    const mini = el('div');
    mini.append(
      el('span', '', DAYS[i]),
      el('span', '', date.getDate()),
      el('i', '', r ? TYPES[r.type].icon : '—'),
    );
    $('#mini-week').append(mini);
    if (r) {
      const card = el('button', 'record-card');
      card.setAttribute(
        'aria-label',
        `${date.getMonth() + 1}월 ${date.getDate()}일 ${r.name} 기록 수정`,
      );
      const visual = el('div', 'record-visual');
      visual.style.background = TYPES[r.type].color;
      visual.append(
        el('span', 'record-day', `${DAYS[i]} ${String(date.getDate()).padStart(2, '0')}`),
      );
      if (r.photo) {
        const img = el('img');
        img.src = r.photo;
        img.alt = `${r.name} 운동 사진`;
        visual.append(img);
      } else visual.append(el('span', '', TYPES[r.type].icon));
      const body = el('div', 'record-body');
      body.append(
        el('strong', '', r.name),
        el('span', 'record-duration', r.minutes === null ? '시간 미입력' : duration(r.minutes)),
      );
      if (r.memo) body.append(el('p', 'record-memo', r.memo));
      card.append(visual, body);
      card.onclick = () => onEdit(date);
      $('#records').append(card);
    }
  });
  if (!count) {
    const empty = el('div', 'empty-records');
    empty.append(
      el('span', 'empty-symbol', '＋'),
      el('h3', '', '아직 비어 있는 이번 주'),
      el('p', '', '위의 날짜를 눌러 첫 움직임을 남겨보세요.'),
    );
    $('#records').append(empty);
  }
}

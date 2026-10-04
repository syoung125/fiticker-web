import { TYPES, dateKey } from '../domain/workouts.js';
import { updateRecord } from '../domain/record-actions.js';
import { createDurationPicker } from './duration-picker.js';
import { $, el } from './dom.js';

export function createRecordSheet({ records, onSave }) {
  const dialog = $('#workout-dialog');
  const form = $('#workout-form');
  const save = $('#save-record');
  const error = $('#form-error');
  const picker = createDurationPicker($('#duration-picker'));
  let key, action;
  const titles = {
    type: '어떤 운동을 했나요?',
    time: '운동 시간',
    memo: '오늘의 메모',
    delete: '기록 삭제',
  };

  function commit(data, cleared = false) {
    try {
      if (action === 'delete') delete records[key];
      else records[key] = updateRecord(records[key], action, data);
      dialog.close();
      onSave(key, action, cleared);
    } catch (e) {
      error.textContent = e.message;
    }
  }
  for (const [type, info] of Object.entries(TYPES)) {
    const button = el('button', 'type-label');
    button.type = 'button';
    button.dataset.type = type;
    button.append(el('span', '', info.icon), document.createTextNode(info.ko));
    button.onclick = () => {
      if (type !== 'other') return commit({ type });
      $('#custom-label').hidden = false;
      $('#custom-name').required = true;
      save.hidden = false;
      $('#custom-name').focus();
    };
    $('#types').append(button);
  }
  $('#close-dialog').onclick = () => dialog.close();
  $('#open-delete').onclick = () => {
    if (action === 'time') return commit({ hours: '', mins: '' }, true);
    if (action === 'memo') return commit({ memo: '' }, true);
    dialog.close();
    open(new Date(`${key}T12:00:00`), 'delete');
  };
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close();
  });
  $('#memo').addEventListener('input', () => {
    $('#memo').value = Array.from($('#memo').value).slice(0, 30).join('');
    $('#memo-count').textContent = `${Array.from($('#memo').value).length} / 30`;
  });
  form.onsubmit = (event) => {
    event.preventDefault();
    if (save.disabled) return;
    if (action === 'type') commit({ type: 'other', name: $('#custom-name').value });
    else if (action === 'time') commit(picker.read());
    else if (action === 'memo') commit({ memo: $('#memo').value });
    else if (action === 'delete') commit();
  };
  function open(date, mode = 'type') {
    key = dateKey(date);
    action = mode;
    form.reset();
    const record = records[key];
    const remove = $('#open-delete');
    remove.hidden = !record || !['type', 'time', 'memo'].includes(action);
    const removeLabel =
      action === 'time' ? '시간 지우기' : action === 'memo' ? '메모 지우기' : '운동 기록 삭제';
    remove.setAttribute('aria-label', removeLabel);
    remove.title = removeLabel;
    $('#dialog-title').textContent = titles[action];
    $('#sheet-date').textContent = date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    document.querySelectorAll('[data-sheet]').forEach((section) => {
      section.hidden = section.dataset.sheet !== action;
    });
    $('#custom-label').hidden = action !== 'type' || record?.type !== 'other';
    $('#custom-name').required = action === 'type' && record?.type === 'other';
    $('#custom-name').value = record?.type === 'other' ? record.name : '';
    document.querySelectorAll('[data-type]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.type === record?.type));
    });
    $('#memo').value = record?.memo ?? '';
    $('#memo-count').textContent = `${Array.from($('#memo').value).length} / 30`;
    error.textContent = '';
    save.disabled = false;
    save.hidden = action === 'type' && record?.type !== 'other';
    save.textContent = action === 'delete' ? '기록 삭제' : '저장';
    dialog.showModal();
    if (action === 'time') picker.set(record?.minutes ?? null);
    if (action === 'memo') $('#memo').focus();
  }
  return { open };
}

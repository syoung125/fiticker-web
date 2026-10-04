import { loadCustomSports, rememberCustomSport } from '../domain/custom-sports.js';
import { TYPES, dateKey, validEmoji } from '../domain/workouts.js';
import { updateRecord } from '../domain/record-actions.js';
import { createDurationPicker } from './duration-picker.js';
import { $, el } from './dom.js';

export function createRecordSheet({ records, onSave }) {
  const dialog = $('#workout-dialog');
  const form = $('#workout-form');
  const save = $('#save-record');
  const error = $('#form-error');
  const picker = createDurationPicker($('#duration-picker'));
  const customSports = loadCustomSports();
  let selectedIcon = '✳️';
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
      const customSaved =
        action === 'type' && records[key]?.type === 'other'
          ? rememberCustomSport(customSports, records[key])
          : true;
      dialog.close();
      if (customSaved) onSave(key, action, cleared);
      else onSave(key, action, cleared, false);
    } catch (e) {
      error.textContent = e.message;
    }
  }
  function setIcon(icon) {
    selectedIcon = icon;
    $('#custom-icon').textContent = icon;
    $('#custom-emoji').value = icon;
  }
  function closeEmojiPicker() {
    $('#emoji-picker').hidden = true;
    $('#custom-icon').setAttribute('aria-expanded', 'false');
  }
  function renderTypes(record) {
    $('#types').replaceChildren();
    $('#more-types').replaceChildren();
    const options = [
      ...Object.entries(TYPES)
        .filter(([type]) => type !== 'other')
        .map(([type, info]) => ({ type, ...info })),
      ...customSports.map((sport) => ({ type: 'other', ko: sport.name, ...sport })),
      { type: 'other', ...TYPES.other },
    ];
    for (const info of options) {
      const button = el('button', 'type-label');
      button.type = 'button';
      button.dataset.type = info.type;
      if (info.name) button.dataset.customName = info.name;
      button.setAttribute(
        'aria-pressed',
        String(info.type === record?.type && (info.type !== 'other' || info.name === record.name)),
      );
      button.append(el('span', '', info.icon), document.createTextNode(info.ko));
      button.onclick = () => {
        if (info.type !== 'other') return commit({ type: info.type });
        if (info.name) return commit({ type: 'other', name: info.name, icon: info.icon });
        $('#custom-label').hidden = false;
        $('#custom-name').required = true;
        save.hidden = false;
        $('#custom-name').focus();
      };
      $(info.extra ? '#more-types' : '#types').append(button);
    }
  }
  function setMoreExpanded(expanded) {
    $('#more-types').hidden = !expanded;
    $('#more-types-toggle').setAttribute('aria-expanded', String(expanded));
    $('#more-types-toggle').textContent = expanded ? '접기' : '더보기';
  }
  $('#more-types-toggle').onclick = () => setMoreExpanded($('#more-types').hidden);
  $('#custom-icon').onclick = () => {
    const expanded = $('#emoji-picker').hidden;
    $('#emoji-picker').hidden = !expanded;
    $('#custom-icon').setAttribute('aria-expanded', String(expanded));
  };
  for (const emoji of [
    '✳️',
    ...Object.values(TYPES)
      .filter((info) => info.extra)
      .map((info) => info.icon),
  ]) {
    const button = el('button', 'emoji-option', emoji);
    button.type = 'button';
    button.setAttribute('aria-label', emoji);
    button.onclick = () => {
      setIcon(emoji);
      closeEmojiPicker();
      $('#custom-icon').focus();
    };
    $('#emoji-options').append(button);
  }
  $('#custom-emoji').addEventListener('input', () => {
    const value = $('#custom-emoji').value.trim();
    if (validEmoji(value)) {
      selectedIcon = value;
      $('#custom-icon').textContent = value;
      error.textContent = '';
    }
  });
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
    if (action === 'type')
      commit({
        type: 'other',
        name: $('#custom-name').value,
        icon: $('#custom-emoji').value.trim() || selectedIcon,
      });
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
    setIcon(record?.type === 'other' ? (record.icon ?? '✳️') : '✳️');
    closeEmojiPicker();
    renderTypes(record);
    setMoreExpanded(Boolean(TYPES[record?.type]?.extra));
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

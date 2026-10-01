import { TYPES, dateKey, weekDates, summarize, validateRecord } from './domain/workouts.js';
import { resizePhoto } from './media/photo.js';
import { createPoster } from './media/poster.js';
import { $, el } from './ui/dom.js';
import { renderEditor } from './ui/render-editor.js';
import { createDurationPicker } from './ui/duration-picker.js';
const records = Object.create(null);
let dates = weekDates(new Date()),
  selectedDate = null,
  draftPhoto = null,
  photoVersion = 0,
  resultURL = null,
  resultBlob = null,
  exportKey = null,
  generating = false,
  toastTimer;
const dialog = $('#workout-dialog');
const durationPicker = createDurationPicker($('#duration-picker'));
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
}
function render() {
  renderEditor({ dates, records, generating, onEdit: openEditor });
}
function updatePhoto() {
  const has = Boolean(draftPhoto);
  $('#photo-preview').hidden = !has;
  $('#photo-prompt').hidden = has;
  $('#remove-photo').hidden = !has;
  if (has) $('#photo-preview').src = draftPhoto;
  else $('#photo-preview').removeAttribute('src');
}
function updateType() {
  const type = $('input[name="type"]:checked')?.value;
  $('#custom-label').hidden = type !== 'other';
  $('#custom-name').required = type === 'other';
}
function openEditor(date) {
  selectedDate = dateKey(date);
  photoVersion++;
  $('#save-record').disabled = false;
  const r = records[selectedDate];
  $('#workout-form').reset();
  $('#dialog-title').textContent = date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  $('#form-error').textContent = '';
  if (r) {
    $(`input[name="type"][value="${r.type}"]`).checked = true;
    $('#custom-name').value = r.type === 'other' ? r.name : '';
    $('#memo').value = r.memo;
  }
  draftPhoto = r?.photo || null;
  $('#delete-record').hidden = !r;
  $('#memo-count').textContent = `${Array.from($('#memo').value).length} / 30`;
  updateType();
  updatePhoto();
  dialog.showModal();
  // Wheel scroll positions must be initialized after the dialog is visible.
  durationPicker.set(r?.minutes ?? null);
}
for (const [value, t] of Object.entries(TYPES)) {
  const label = el('label', 'type-label');
  const input = el('input');
  input.type = 'radio';
  input.name = 'type';
  input.value = value;
  input.required = true;
  input.addEventListener('change', updateType);
  label.append(input, el('span', '', t.icon), document.createTextNode(t.ko));
  $('#types').append(label);
}
$('#close-dialog').onclick = () => dialog.close();
dialog.addEventListener('close', () => {
  photoVersion++;
});
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      dialog.close();
  }
});
$('#memo').addEventListener('input', () => {
  $('#memo').value = Array.from($('#memo').value).slice(0, 30).join('');
  $('#memo-count').textContent = `${Array.from($('#memo').value).length} / 30`;
});
$('#photo').addEventListener('change', async () => {
  const file = $('#photo').files[0];
  if (!file) return;
  const version = ++photoVersion;
  $('#save-record').disabled = true;
  $('#form-error').textContent = '사진을 준비하고 있어요…';
  try {
    const photo = await resizePhoto(file);
    if (version === photoVersion) {
      draftPhoto = photo;
      updatePhoto();
      $('#form-error').textContent = '';
    }
  } catch (e) {
    if (version === photoVersion) $('#form-error').textContent = e.message;
  } finally {
    if (version === photoVersion) $('#save-record').disabled = false;
  }
});
$('#remove-photo').onclick = () => {
  photoVersion++;
  draftPhoto = null;
  $('#photo').value = '';
  $('#form-error').textContent = '';
  $('#save-record').disabled = false;
  updatePhoto();
};
$('#workout-form').onsubmit = (e) => {
  e.preventDefault();
  try {
    const record = validateRecord({
      type: $('input[name="type"]:checked')?.value,
      name: $('#custom-name').value,
      ...durationPicker.read(),
      memo: $('#memo').value,
    });
    records[selectedDate] = { ...record, photo: draftPhoto };
    dialog.close();
    render();
    toast('오늘의 움직임을 기록했어요.');
  } catch (error) {
    $('#form-error').textContent = error.message;
  }
};
$('#delete-record').onclick = () => {
  delete records[selectedDate];
  dialog.close();
  render();
  toast('기록을 삭제했어요.');
};
function moveWeek(n) {
  const d = new Date(dates[0]);
  d.setDate(d.getDate() + n * 7);
  dates = weekDates(d);
  render();
}
$('#previous').onclick = () => moveWeek(-1);
$('#next').onclick = () => moveWeek(1);
$('#today').onclick = () => {
  dates = weekDates(new Date());
  render();
};
$('#generate').onclick = async () => {
  if (generating) return;
  generating = true;
  const exportDates = dates.map((d) => new Date(d));
  const exportRecords = structuredClone(records);
  exportKey = dateKey(exportDates[0]);
  const button = $('#generate');
  button.disabled = true;
  button.textContent = '이미지 만드는 중…';
  try {
    resultBlob = await createPoster(exportDates, exportRecords);
    if (resultURL) URL.revokeObjectURL(resultURL);
    resultURL = URL.createObjectURL(resultBlob);
    $('#result').src = resultURL;
    $('#download').href = resultURL;
    $('#download').download = `move-diary-${exportKey}.png`;
    $('#editor').hidden = true;
    $('#preview').hidden = false;
    const file = new File([resultBlob], 'move-diary.png', { type: 'image/png' });
    $('#share').hidden = !navigator.canShare?.({ files: [file] });
    window.scrollTo({ top: 0 });
    $('#back').focus();
  } catch (error) {
    toast(error.message || '이미지 생성에 실패했어요. 다시 시도해 주세요.');
  } finally {
    button.replaceChildren(document.createTextNode('이미지 만들기 '), el('span', '', '↗'));
    generating = false;
    button.disabled = summarize(dates, records).count === 0;
  }
};
$('#back').onclick = () => {
  $('#preview').hidden = true;
  $('#editor').hidden = false;
  $('#generate').focus();
};
$('#share').onclick = async () => {
  try {
    await navigator.share({
      files: [new File([resultBlob], `move-diary-${exportKey}.png`, { type: 'image/png' })],
    });
  } catch (e) {
    if (e.name !== 'AbortError') toast('공유할 수 없어요. 이미지 저장을 이용해 주세요.');
  }
};
render();

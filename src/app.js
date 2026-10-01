import { dateKey, weekDates, navigateWeek, summarize } from './domain/workouts.js';
import { createPhotoPicker } from './ui/photo-picker.js';
import { createRecordSheet } from './ui/record-sheet.js';
import { createPoster } from './media/poster.js';
import { $, el } from './ui/dom.js';
import { renderEditor } from './ui/render-editor.js';
import { loadSummaryFonts } from './media/summary.js';
const records = Object.create(null);
let dates = weekDates(new Date()),
  resultURL = null,
  resultBlob = null,
  exportKey = null,
  generating = false,
  toastTimer;
const photoPicker = createPhotoPicker({ records, onChange: render, notify: toast });
const recordSheet = createRecordSheet({
  records,
  onSave(key, action) {
    if (action === 'delete') photoPicker.invalidate(key);
    render();
    $(`[data-date="${key}"]`)?.focus({ preventScroll: true });
    toast(action === 'delete' ? '기록을 삭제했어요.' : '기록을 저장했어요.');
  },
});
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
}
function render() {
  renderEditor({
    dates,
    records,
    generating,
    onEdit: (date, action) => {
      if (action === 'photo') photoPicker.open(date);
      else if (action === 'remove-photo') photoPicker.remove(date);
      else recordSheet.open(date, action);
    },
  });
}
function moveWeek(n) {
  dates = navigateWeek(dates[0], n);
  render();
}
$('#previous').onclick = () => moveWeek(-1);
$('#next').onclick = () => moveWeek(1);
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

// Redraw the live summary when web fonts become available, just like PNG export.
loadSummaryFonts().then(() => render());

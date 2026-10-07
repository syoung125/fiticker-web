import { loadSessionRecords, saveSessionRecords } from './domain/session-records.js';
import { weekDates, navigateWeek } from './domain/workouts.js';
import { createStickerGallery } from './ui/sticker-gallery.js';
import { createRecordSheet } from './ui/record-sheet.js';
import { $ } from './ui/dom.js';
import { renderEditor } from './ui/render-editor.js';
import { loadSummaryFonts } from './media/summary.js';
const records = loadSessionRecords();
let dates = weekDates(new Date()),
  toastTimer;
const stickerGallery = createStickerGallery({ notify: toast });
const recordSheet = createRecordSheet({
  records,
  onSave(key, action, cleared, customSaved = true, recordIndex = 0) {
    const cached = saveSessionRecords(records);
    render();
    const target = ['time', 'memo'].includes(action)
      ? $(
          `[data-record-date="${key}"][data-record-action="${action}"][data-record-index="${recordIndex}"]`,
        )
      : $(`[data-date="${key}"]`);
    target?.focus({ preventScroll: true });
    toast(
      !cached
        ? '이 환경에서는 새로고침 후 기록이 유지되지 않을 수 있어요.'
        : !customSaved
          ? '기록을 저장했어요. 이 환경에서는 추가한 종목이 다음 방문까지 유지되지 않을 수 있어요.'
          : cleared
            ? action === 'time'
              ? '시간을 지웠어요.'
              : '메모를 지웠어요.'
            : action === 'delete'
              ? '기록을 삭제했어요.'
              : '기록을 저장했어요.',
    );
  },
});
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
}
function render() {
  void stickerGallery.update(dates, records);
  renderEditor({
    dates,
    records,
    onEdit: (date, action, index) => recordSheet.open(date, action, index),
  });
}
function moveWeek(offset) {
  dates = navigateWeek(dates[0], offset);
  render();
}
$('#previous').onclick = () => moveWeek(-1);
$('#next').onclick = () => moveWeek(1);
render();
loadSummaryFonts().then(render);

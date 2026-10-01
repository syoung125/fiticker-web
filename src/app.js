import { weekDates, navigateWeek } from './domain/workouts.js';
import { createStickerGallery } from './ui/sticker-gallery.js';
import { createRecordSheet } from './ui/record-sheet.js';
import { $ } from './ui/dom.js';
import { renderEditor } from './ui/render-editor.js';
import { loadSummaryFonts } from './media/summary.js';
const records = Object.create(null);
let dates = weekDates(new Date()),
  toastTimer;
const stickerGallery = createStickerGallery({ notify: toast });
const recordSheet = createRecordSheet({
  records,
  onSave(key, action) {
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
  void stickerGallery.update(dates, records);
  renderEditor({ dates, records, onEdit: (date, action) => recordSheet.open(date, action) });
}
function moveWeek(offset) {
  dates = navigateWeek(dates[0], offset);
  render();
}
$('#previous').onclick = () => moveWeek(-1);
$('#next').onclick = () => moveWeek(1);
render();
loadSummaryFonts().then(render);

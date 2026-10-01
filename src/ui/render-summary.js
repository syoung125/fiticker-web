import { drawSummary, SUMMARY_WIDTH, SUMMARY_HEIGHT } from '../media/summary.js';

export function renderSummary(canvas, model) {
  // Render at export resolution so the visible line breaks and alignment match the PNG.
  canvas.width = SUMMARY_WIDTH;
  canvas.height = SUMMARY_HEIGHT;
  drawSummary(canvas.getContext('2d'), model);
  const details = model.sports.map((sport) => `${sport.name} ${sport.time}`).join(', ');
  canvas.setAttribute(
    'aria-label',
    `운동 ${model.count}회, 총 ${model.total}${details ? ', ' + details : ''}`,
  );
}

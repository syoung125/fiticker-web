const gallery = document.querySelector('.story-gallery');
if (gallery) {
  const viewport = gallery.querySelector('.story-viewport');
  const track = gallery.querySelector('.story-track');
  const toggle = gallery.querySelector('.story-motion-toggle');
  const originals = [...track.children];
  for (const slide of originals) {
    const copy = slide.cloneNode(true);
    copy.dataset.storyCopy = '';
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelector('img').alt = '';
    track.append(copy);
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cycleWidth = 0;
  let frame = 0;
  let previous = 0;
  let position = 0;
  let visible = false;
  let paused = false;
  let hovering = false;
  let dragging = false;
  let held = false;
  let timer;
  let dragStart = 0;
  let dragScroll = 0;
  const canPlay = () =>
    visible &&
    !document.hidden &&
    !reduced.matches &&
    !paused &&
    !hovering &&
    !dragging &&
    !held &&
    !viewport.matches(':focus-visible');
  const tick = (time) => {
    frame = 0;
    if (!canPlay()) return;
    if (previous && cycleWidth > 0) {
      position = (position + (Math.min(time - previous, 50) / 1000) * 18) % cycleWidth;
      viewport.scrollLeft = position;
    }
    previous = time;
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    position = viewport.scrollLeft;
    if (canPlay()) frame = requestAnimationFrame(tick);
  };
  const hold = (duration = 5000) => {
    clearTimeout(timer);
    held = true;
    sync();
    timer = setTimeout(() => {
      held = false;
      sync();
    }, duration);
  };
  const measure = () => {
    cycleWidth = track.children[originals.length].offsetLeft - track.children[0].offsetLeft;
    sync();
  };
  const updateToggle = () => {
    toggle.hidden = reduced.matches;
    toggle.dataset.paused = String(paused);
    toggle.setAttribute(
      'aria-label',
      paused ? '스토리 자동 넘김 재생' : '스토리 자동 넘김 일시정지',
    );
  };
  toggle.addEventListener('click', () => {
    paused = !paused;
    clearTimeout(timer);
    held = false;
    updateToggle();
    sync();
  });
  viewport.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    sync();
  });
  viewport.addEventListener('pointerleave', () => {
    hovering = false;
    sync();
  });
  viewport.addEventListener('pointerdown', (event) => {
    dragging = true;
    hold();
    if (event.pointerType === 'mouse') {
      dragStart = event.clientX;
      dragScroll = viewport.scrollLeft;
      viewport.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!dragging || event.pointerType !== 'mouse') return;
    viewport.scrollLeft = dragScroll + dragStart - event.clientX;
  });
  const endDrag = () => {
    dragging = false;
    hold();
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('lostpointercapture', endDrag);
  viewport.addEventListener('wheel', () => hold(), { passive: true });
  viewport.addEventListener('keydown', () => hold());
  viewport.addEventListener('focusin', sync);
  viewport.addEventListener('focusout', () => requestAnimationFrame(sync));
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => {
    updateToggle();
    measure();
  });
  new ResizeObserver(measure).observe(viewport);
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      sync();
    },
    { threshold: 0.1 },
  ).observe(viewport);
  updateToggle();
  measure();
  hold(1800);
}

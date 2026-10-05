const gallery = document.querySelector('.story-gallery');
if (gallery) {
  const viewport = gallery.querySelector('.story-viewport');
  const track = gallery.querySelector('.story-track');
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
  let offset = 0;
  let animating = false;
  let visible = false;
  let touching = false;
  let dragging = false;
  let held = false;
  let timer;
  let dragStart = 0;
  let dragScroll = 0;
  const canPlay = () =>
    visible && !document.hidden && !reduced.matches && !touching && !dragging && !held;
  const tick = (time) => {
    frame = 0;
    if (!canPlay()) return;
    if (previous && cycleWidth > 0) {
      offset = (offset + (Math.min(time - previous, 50) / 1000) * 18) % cycleWidth;
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }
    previous = time;
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    const next = canPlay();
    if (next !== animating) {
      // Transfer the visible position between native swiping and subpixel animation.
      const position = viewport.scrollLeft + offset;
      track.style.transform = '';
      viewport.scrollLeft = next ? 0 : position;
      offset = position - viewport.scrollLeft;
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      animating = next;
    }
    if (next) frame = requestAnimationFrame(tick);
  };
  const hold = (duration = 500) => {
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
  viewport.addEventListener(
    'touchstart',
    () => {
      touching = true;
      hold();
    },
    { passive: true },
  );
  const endTouch = () => {
    touching = false;
    hold();
  };
  viewport.addEventListener('touchend', endTouch, { passive: true });
  viewport.addEventListener('touchcancel', endTouch, { passive: true });
  viewport.addEventListener(
    'scroll',
    () => {
      // Let native momentum finish before resuming automatic movement.
      if (!animating && !touching && !dragging) hold();
    },
    { passive: true },
  );
  viewport.addEventListener('wheel', () => hold(), { passive: true });
  viewport.addEventListener('keydown', () => hold());
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', measure);
  new ResizeObserver(measure).observe(viewport);
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      sync();
    },
    { threshold: 0.1 },
  ).observe(viewport);
  measure();
  hold(1800);
}

export function createHeaderScrollState() {
  let previous = 0;
  let direction = 0;
  let distance = 0;
  let hidden = false;
  const reset = (y) => {
    previous = y;
    direction = 0;
    distance = 0;
  };
  return {
    reset,
    update(y, { height, max, pinned = false }) {
      const position = Math.max(0, Math.min(y, max));
      const delta = position - previous;
      previous = position;
      if (pinned || position <= 16) {
        hidden = false;
        reset(position);
        return hidden;
      }
      if (!delta) return hidden;
      const nextDirection = Math.sign(delta);
      distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta);
      direction = nextDirection;
      if (direction > 0 && position > height && distance >= 12) hidden = true;
      if (direction < 0 && distance >= 8) hidden = false;
      return hidden;
    },
  };
}

export function setupScrollHeader() {
  const header = document.querySelector('.topbar');
  if (!header) return;
  const root = document.documentElement;
  const menu = header.querySelector('.site-menu');
  const state = createHeaderScrollState();
  const maxScroll = () => Math.max(0, root.scrollHeight - window.innerHeight);
  const position = () => Math.max(0, Math.min(window.scrollY, maxScroll()));
  let pending = false;
  state.reset(position());
  const update = () => {
    pending = false;
    const active = document.activeElement;
    const pinned =
      menu?.open ||
      (header.contains(active) && active.matches(':focus-visible')) ||
      Boolean(document.querySelector('dialog[open]'));
    root.classList.toggle(
      'header-hidden',
      state.update(window.scrollY, { height: header.offsetHeight, max: maxScroll(), pinned }),
    );
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    state.reset(position());
    schedule();
  });
  window.addEventListener('pageshow', () => {
    state.reset(position());
    schedule();
  });
  menu?.addEventListener('toggle', schedule);
  header.addEventListener('focusin', schedule);
  header.addEventListener('focusout', schedule);
}

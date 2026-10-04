// Content stays visible when motion is disabled or observers are unavailable.
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const page = document.querySelector('.home-page');
if (page && !motion.matches && 'IntersectionObserver' in window) {
  const running = new Set();
  const animate = (element, frames, options) => {
    const animation = element.animate(frames, options);
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (motion.matches || entry.target.contains(document.activeElement)) continue;
        animate(
          entry.target,
          [
            { opacity: 0, transform: 'translateY(18px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 700, easing: 'cubic-bezier(.2,.7,.2,1)' },
        );
        if (entry.target.classList.contains('home-art')) {
          animate(
            page.querySelector('.sample-track span'),
            [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
            { duration: 1100, easing: 'cubic-bezier(.2,.7,.2,1)' },
          );
          for (const [selector, angle, offset] of [
            ['.sample-progress', -3, -7],
            ['.sample-calendar', 2, 6],
          ]) {
            animate(
              page.querySelector(selector),
              [
                { transform: `translateY(0) rotate(${angle}deg)` },
                { transform: `translateY(${offset}px) rotate(${angle - 1}deg)` },
                { transform: `translateY(0) rotate(${angle}deg)` },
              ],
              { duration: 4200, easing: 'ease-in-out' },
            );
          }
        }
      }
    },
    { threshold: 0.12 },
  );
  page
    .querySelectorAll(
      '.home-intro, .home-art, .section-heading, .weekly-service-card, .home-how h2, .home-how li, .home-feedback',
    )
    .forEach((element) => observer.observe(element));
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    observer.disconnect();
    running.forEach((animation) => animation.cancel());
  });
  page.addEventListener('focusin', () => {
    running.forEach((animation) => {
      if (animation.effect.target.contains(document.activeElement)) animation.cancel();
    });
  });
}

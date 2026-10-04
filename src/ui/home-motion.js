// Keep the page readable without JavaScript or when reduced motion is enabled.
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const page = document.querySelector('.home-page');
if (page && !motion.matches && 'IntersectionObserver' in window && page.animate) {
  const elements = [
    ...page.querySelectorAll(
      '.home-intro > *, .home-art, .section-heading, .weekly-service-card, .home-how h2, .home-how li, .home-feedback',
    ),
  ];
  const animations = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      const entering = new Set(
        entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target),
      );
      let order = 0;
      for (const element of elements) {
        if (!entering.has(element)) continue;
        observer.unobserve(element);
        const animation = animations.get(element);
        if (!animation) continue;
        if (motion.matches || element.contains(document.activeElement)) {
          animation.cancel();
          continue;
        }
        animation.effect.updateTiming({ delay: Math.min(order * 110, 550) });
        animation.play();
        order += 1;
      }
    },
    { threshold: 0.08 },
  );
  for (const element of elements) {
    const animation = element.animate(
      [
        { opacity: 0, transform: 'translateY(22px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' },
    );
    animation.pause();
    animations.set(element, animation);
    animation.finished
      .then(() => animation.cancel())
      .catch(() => {})
      .finally(() => animations.delete(element));
    observer.observe(element);
  }
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    observer.disconnect();
    animations.forEach((animation) => animation.cancel());
  });
  page.addEventListener('focusin', () => {
    animations.forEach((animation, element) => {
      if (!element.contains(document.activeElement)) return;
      observer.unobserve(element);
      animation.cancel();
    });
  });
}

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
        animation.effect.updateTiming({ delay: Math.min(order * 150, 750) });
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
      { duration: 1100, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'both' },
    );
    animation.pause();
    animations.set(element, animation);
    animation.finished
      .then(() => animation.cancel())
      .catch(() => {})
      .finally(() => animations.delete(element));
    observer.observe(element);
  }
  const progress = page.querySelector('.sample-track span');
  let hasScrolled = false;
  let progressVisible = false;
  let progressPlayed = false;
  const playProgress = () => {
    if (!hasScrolled || !progressVisible || progressPlayed || motion.matches) return;
    progressPlayed = true;
    progressObserver.disconnect();
    window.removeEventListener('scroll', onFirstScroll);
    const animation = progress.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
      duration: 1500,
      easing: 'cubic-bezier(.2,.65,.3,1)',
    });
    animations.set(progress, animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(progress));
  };
  const onFirstScroll = () => {
    hasScrolled = true;
    window.removeEventListener('scroll', onFirstScroll);
    playProgress();
  };
  const progressObserver = new IntersectionObserver(
    ([entry]) => {
      progressVisible = entry.isIntersecting;
      playProgress();
    },
    { threshold: 0.5 },
  );
  if (progress) {
    progressObserver.observe(progress);
    window.addEventListener('scroll', onFirstScroll, { passive: true });
  }
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    observer.disconnect();
    progressObserver.disconnect();
    window.removeEventListener('scroll', onFirstScroll);
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

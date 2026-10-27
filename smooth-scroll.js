// Light inertial wheel scrolling on desktop: smooth, but it settles quickly enough for reading.
// Touch devices and narrow screens keep native scrolling.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1025px) and (hover: hover) and (pointer: fine)');
  if (reduced.matches || !desktop.matches || typeof Lenis === 'undefined') return;
  window.lenis = new Lenis({
    lerp: 0.14,
    wheelMultiplier: 1.1,
    anchors: true,
    allowNestedScroll: true,
    autoRaf: true
  });
})();

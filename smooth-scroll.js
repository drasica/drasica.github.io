// Inertial wheel scrolling on desktop, like the reference (ScrollSmoother, smooth 1.4).
// Touch devices and narrow screens keep native scrolling.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1025px) and (hover: hover) and (pointer: fine)');
  if (reduced.matches || !desktop.matches || typeof Lenis === 'undefined') return;
  window.lenis = new Lenis({
    lerp: 0.08,
    anchors: true,
    allowNestedScroll: true,
    autoRaf: true
  });
})();

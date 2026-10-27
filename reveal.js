(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  const active = new Set();
  const pending = new Set();
  // Reference rhythm: 25px rise, 1.2 seconds, 100ms between neighbours.
  // Timings shrink with scroll speed so fast scrolling never waits for content.
  let velocity = 0, lastY = scrollY, lastT = performance.now();
  window.addEventListener('scroll', () => {
    const now = performance.now(), dt = now - lastT;
    if (dt > 0) velocity = Math.abs(scrollY - lastY) / dt;
    lastY = scrollY; lastT = now;
  }, {passive: true});
  function speedFactor() {
    if (performance.now() - lastT > 150) velocity = 0;
    return 1 - Math.min(velocity, 6) / 8;
  }
  const adaptiveDuration = base => Math.max(300, base * Math.max(.3, speedFactor()));
  const adaptiveStagger = base => Math.max(20, base * Math.max(.25, speedFactor()));
  const media = '.case-stories img,.case-artwork,.case-billboards>img,.billboard-pair img,.outdoor-grid img,.project > .picture,.gallery .picture,.article .picture';
  function reveal(element, index = 0, firstScreen = false) {
    pending.delete(element);
    element.classList.remove('reveal-pending');
    if (!firstScreen && element.matches('.statement,section h2')) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      const words = [];
      nodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        node.textContent.split(/([ \t\r\n]+)/).forEach(part => {
          if (!part || /^\s+$/.test(part)) { fragment.append(document.createTextNode(part)); return; }
          const mask = document.createElement('span');
          mask.className = 'text-reveal-word';
          const inner = document.createElement('span');
          inner.className = 'text-reveal-inner';
          inner.textContent = part;
          mask.append(inner); fragment.append(mask); words.push(inner);
        });
        node.replaceWith(fragment);
      });
      const duration = adaptiveDuration(1000), stagger = adaptiveStagger(35);
      words.forEach((word, i) => {
        const animation = word.animate([
          {transform: 'translateY(130%)'}, {transform: 'translateY(0)'}
        ], {duration, delay: i * stagger, easing: 'cubic-bezier(.165,.84,.44,1)', fill: 'backwards'});
        active.add(animation);
        animation.onfinish = () => active.delete(animation);
      });
      return;
    }
    if (firstScreen) {
      const animation = element.animate([{opacity: 0}, {opacity: 1}],
        {duration: 900, delay: Math.min(index, 5) * 100, easing: 'cubic-bezier(.215,.61,.355,1)', fill: 'backwards'});
      active.add(animation);
      animation.onfinish = () => active.delete(animation);
      return;
    }
    // Images settle from a slight zoom; text and blocks rise 25px.
    const image = element.matches(media);
    const animation = element.animate(image ? [
      {opacity: 0, translate: '0 15px', scale: 1.04},
      {opacity: 1, translate: '0 0', scale: 1}
    ] : [
      {opacity: 0, translate: '0 25px'},
      {opacity: 1, translate: '0 0'}
    ], {
      duration: adaptiveDuration(image ? 1400 : 1200),
      delay: Math.min(index, 4) * adaptiveStagger(100),
      easing: 'cubic-bezier(.215,.61,.355,1)', fill: 'backwards'
    });
    active.add(animation);
    animation.onfinish = () => active.delete(animation);
  }
  const observer = new IntersectionObserver(entries => {
    let index = 0;
    entries.filter(entry => entry.isIntersecting).forEach(entry => {
      observer.unobserve(entry.target);
      reveal(entry.target, index++);
    });
  }, {rootMargin: '0px 0px -8% 0px', threshold: 0});
  const selectors = [
    media,
    'main section:not(.hero) p', 'main section:not(.hero) h2', 'main section:not(.hero) h3',
    '.portraits',
    '.filter-buttons', '.footer-inner .contact-heading', '.footer-inner .availability',
    '.footer-inner nav', '.contact-actions', '.footer-avatar', '.social-links'
  ];
  const candidates = [...document.querySelectorAll(selectors.join(','))];
  // Animate a card as one unit, avoiding nested delays and compounded movement.
  candidates.filter(el => !candidates.some(parent => parent !== el && parent.contains(el))).forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight * .92 && !el.hidden) return;
    el.classList.add('reveal-pending');
    pending.add(el);
    observer.observe(el);
  });
  document.querySelectorAll('.hero-photo,.case-cover,.header .name,.case-breadcrumb,.header-actions,.hero h1 > span,.hero .location,.case-identity,.case-introduction,.case-tags,.case-meta').forEach((el, i) => {
    reveal(el, i, true);
  });
  // Keyboard and anchor navigation must never land on invisible content.
  function showTarget(target) {
    for (const el of pending) {
      if (el.contains(target) || target.contains(el)) {
        observer.unobserve(el); pending.delete(el); el.classList.remove('reveal-pending');
      }
    }
  }
  document.addEventListener('focusin', event => showTarget(event.target));
  window.addEventListener('hashchange', () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target) showTarget(target);
  });
  reduced.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    pending.forEach(el => el.classList.remove('reveal-pending'));
    pending.clear(); active.forEach(animation => animation.cancel()); active.clear();
  });
})();

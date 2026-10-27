(() => {
  const artwork = document.querySelectorAll('.tanu-art, .tanu-origins');
  const resize = () => artwork.forEach(frame => {
    const stage = frame.querySelector('.tanu-stage');
    const width = frame.classList.contains('tanu-origins') ? 590 : 1200;
    stage.style.transform = `scale(${frame.clientWidth / width})`;
  });
  const observer = new ResizeObserver(resize);
  artwork.forEach(frame => observer.observe(frame));
  resize();
})();

// Campaign videos: fetch each one only when it is about a screen away.
document.querySelectorAll('video[data-src]').forEach(video => {
 const load = () => { video.autoplay = true; video.src = video.dataset.src; video.removeAttribute('data-src'); };
 if(!('IntersectionObserver' in window)) return load();
 const observer = new IntersectionObserver(entries => {
  if(entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); }
 }, {rootMargin: '100% 0px'});
 observer.observe(video);
});

// Wordmark build (after the Sable reference): on dark, TANU assembles from geometric pieces, a circle grows
// from the bowl of the U and inverts the tile to its usual beige, then the pieces retract and dark returns.
// The colour pair can be overridden per image with data-tanu-dark (the prototype shows #061A1E next to it).
document.querySelectorAll('img[src$="tanu/52b47.svg"]').forEach((img, n) => {
 if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 const NS = 'http://www.w3.org/2000/svg';
 const DARK = img.dataset.tanuDark || '#178189', LIGHT = '#FDE3BC', LOOP = 5200;
 const id = name => `tanu${n}-${name}`;
 // The wordmark box sits inside the 386×168 tile; these bounds cover the whole tile in wordmark units.
 const TILE = { x: -47, y: -53, w: 386, h: 168 };
 const make = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.append(n); return n; };
 // Each letter is cut into bands that slide in from different sides: [x0, x1, y0, y1] of its box, entry side, start (s).
 const CUTS = [
  [[0, 1, 0, .22, 'l', .05], [0, 1, .22, 1, 't', .2]],
  [[0, .5, 0, 1, 'b', .3], [.5, 1, 0, 1, 't', .42]],
  [[0, .26, 0, 1, 'b', .5], [.26, .74, 0, 1, 'l', .6], [.74, 1, 0, 1, 't', .7]],
  [[0, 1, 0, .58, 't', .78], [0, 1, .58, 1, 'r', .9]]
 ];
 fetch(img.src).then(r => r.text()).then(text => {
  const paths = [...new DOMParser().parseFromString(text, 'image/svg+xml').querySelectorAll('path')].map(p => p.getAttribute('d'));
  const svg = make('svg', { viewBox: '0 0 291.255 61.4036', role: 'img', 'aria-label': 'TANU', style: 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;display:block' });
  const defs = make('defs', {}, svg);
  paths.forEach((d, i) => make('path', { id: id(`l${i}`), d }, defs));
  img.replaceWith(svg);
  const boxes = paths.map((_, i) => svg.querySelector(`#${id(`l${i}`)}`).getBBox());
  const word = make('g', { id: id('word') }, defs);
  const pieces = [];
  CUTS.forEach((cuts, i) => cuts.forEach(([x0, x1, y0, y1, side, s], k) => {
   const b = boxes[i], pad = 1;
   const r = { x: b.x + b.width * x0 - pad, y: b.y + b.height * y0 - pad, w: b.width * (x1 - x0) + pad * 2, h: b.height * (y1 - y0) + pad * 2 };
   const rect = make('rect', {}, make('clipPath', { id: id(`c${i}-${k}`) }, defs));
   make('use', { href: `#${id(`l${i}`)}` }, make('g', { 'clip-path': `url(#${id(`c${i}-${k}`)})` }, word));
   pieces.push({ rect, r, side, s });
  }));
  const bg = (fill, parent) => make('rect', { x: TILE.x - 10, y: TILE.y - 10, width: TILE.w + 20, height: TILE.h + 20, fill }, parent);
  // Layer 1: dark tile, beige letters.
  bg(DARK, svg); make('use', { href: `#${id('word')}`, fill: LIGHT }, svg);
  // Layer 2: the beige circle with dark letters (the tile's usual look).
  const u = boxes[3], cx = u.x + u.width / 2, cy = u.y + u.height * .72;
  const lightCircle = make('circle', { cx, cy, r: 0 }, make('clipPath', { id: id('light') }, defs));
  const lightLayer = make('g', { 'clip-path': `url(#${id('light')})` }, svg);
  bg(LIGHT, lightLayer); make('use', { href: `#${id('word')}`, fill: DARK }, lightLayer);
  // Layer 3: the dark circle that closes the loop.
  const darkCircle = make('circle', { cx, cy, r: 0 }, make('clipPath', { id: id('dark') }, defs));
  bg(DARK, make('g', { 'clip-path': `url(#${id('dark')})` }, svg));
  const reach = Math.hypot(Math.max(cx - TILE.x, TILE.x + TILE.w - cx), Math.max(cy - TILE.y, TILE.y + TILE.h - cy)) + 4;
  const expoOut = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const inOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  function place(p, k) {
   // k = visible share of the band, growing from its entry side.
   const { x, y, w, h } = p.r;
   const vw = p.side === 'l' || p.side === 'r' ? w * k : w, vh = p.side === 't' || p.side === 'b' ? h * k : h;
   p.rect.setAttribute('x', p.side === 'r' ? x + w - vw : x);
   p.rect.setAttribute('y', p.side === 'b' ? y + h - vh : y);
   p.rect.setAttribute('width', Math.max(0, vw)); p.rect.setAttribute('height', Math.max(0, vh));
  }
  let start = 0, running = false, frame = 0;
  function render(now) {
   const t = ((now - start) % LOOP) / 1000;
   for (const p of pieces) {
    const build = expoOut(seg(t, p.s, p.s + .45));
    const retract = inOut(seg(t, 3.55 + (1 - p.s) * .45, 3.95 + (1 - p.s) * .45));
    place(p, build * (1 - retract));
   }
   lightCircle.setAttribute('r', (reach * inOut(seg(t, 1.45, 2.05))).toFixed(2));
   darkCircle.setAttribute('r', (reach * inOut(seg(t, 4.15, 4.85))).toFixed(2));
   if (running) frame = requestAnimationFrame(render);
  }
  // Animate only while the tile is on screen.
  new IntersectionObserver(entries => {
   const visible = entries.some(e => e.isIntersecting);
   if (visible && !running) { running = true; start = performance.now(); frame = requestAnimationFrame(render); }
   else if (!visible && running) { running = false; cancelAnimationFrame(frame); }
  }).observe(svg);
 });
});

// Mark: the outline draws itself, then the fill swells inward from the outline and the mark settles on a soft
// spring (after the Google Arts & Culture splash). Every frame is built from the mark's own contours, so the
// shape never bends. Loop: outline → fill → hold → the fill drains back into the outline → the outline unwinds.
document.querySelectorAll('img[src$="tanu/48bb3.svg"]').forEach((img, n) => {
 if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 const NS = 'http://www.w3.org/2000/svg', CX = 193.5, CY = 200;
 const make = (tag, attrs, parent) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); parent && parent.append(el); return el; };
 const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
 const expoOut = u => u >= 1 ? 1 : 1 - Math.pow(2, -10 * u);
 const expoIn = u => u <= 0 ? 0 : Math.pow(2, 10 * u - 10);
 const expoInOut = u => u <= 0 ? 0 : u >= 1 ? 1 : u < .5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2;
 const smooth = u => u * u * (3 - 2 * u);
 const cubicOut = u => 1 - Math.pow(1 - u, 3), cubicInOut = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
 // damped spring released at u = 0 (a small overshoot that settles in about half a second)
 const spring = u => u <= 0 ? 0 : Math.exp(-7.5 * u) * Math.sin(17 * u);
 // outline draw, fill, hold, leave, rest (seconds)
 const DRAW = [.08, 1.02], FILL = 1.06, HOLD = 3.3, LOOP = 4.75;
 fetch(img.src).then(r => r.text()).then(text => {
  const src = new DOMParser().parseFromString(text, 'image/svg+xml');
  const D = src.querySelector('path').getAttribute('d');
  const ink = src.querySelector('path').getAttribute('fill') || '#178189';
  const tile = src.querySelector('rect')?.getAttribute('fill') || '#DBF2F7';
  const contours = D.match(/M[^M]*/g);
  const svg = make('svg', { viewBox: '0 0 387 387', role: 'img', 'aria-label': 'TANU', style: img.getAttribute('style') || 'position:absolute;inset:0;width:100%;height:100%;display:block' });
  make('rect', { width: 387, height: 387, rx: 8, fill: tile }, svg);
  const clip = make('clipPath', { id: `tanu-mark${n}-clip` }, make('defs', {}, svg));
  make('path', { d: D }, clip);
  const g = make('g', {}, svg);
  const line = contours.map(d => make('path', { d, fill: 'none', stroke: ink, 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 1' }, g));
  const fill = make('g', { 'clip-path': `url(#tanu-mark${n}-clip)` }, g);
  const swell = contours.map(d => make('path', { d, fill: 'none', stroke: ink, 'stroke-width': 0, 'stroke-linejoin': 'round' }, fill));
  img.replaceWith(svg);
  // contour 0 is the outer edge and draws over the whole span; the counters inside start a beat later and
  // close a beat later, so the shape fills from the outside in
  const lag = i => i === 0 ? 0 : .1 + .045 * i;
  function pose(t) {
   const leaving = t >= HOLD;
   line.forEach((p, i) => {
    const a = DRAW[0] + lag(i), b = DRAW[1] + lag(i) * .4;
    const on = cubicOut(seg(t, a, b)), off = cubicInOut(seg(t, HOLD + .3 + lag(i) * .5, HOLD + .95 + lag(i) * .3));
    p.setAttribute('stroke-dashoffset', leaving ? -off : 1 - on);
    // a zero-length dash would still paint its round caps as a dot
    p.setAttribute('visibility', (leaving ? off < .995 : on > .005) ? 'visible' : 'hidden');
    // anticipation: the line gathers weight just before the fill lands, and again as it drains
    const gather = smooth(seg(t, FILL - .18, FILL)) * (1 - seg(t, FILL, FILL + .12)) + (leaving ? smooth(seg(t, HOLD + .15, HOLD + .3)) * (1 - seg(t, HOLD + .3, HOLD + .6)) : 0);
    p.setAttribute('stroke-width', (1.4 + 1.4 * gather).toFixed(2));
   });
   swell.forEach((p, i) => {
    const w = leaving ? 34 * (1 - expoIn(seg(t, HOLD, HOLD + .32))) : 34 * expoOut(seg(t, FILL + lag(i) * .35, FILL + .34 + lag(i) * .35));
    p.setAttribute('stroke-width', w.toFixed(2));
   });
   // the settle: a slight dip as the fill arrives, a soft overshoot, rest; a gentle dip on the way out
   const s = 1 - .014 * smooth(seg(t, FILL - .2, FILL)) * (1 - seg(t, FILL, FILL + .05)) + .03 * spring(t - FILL)
           - (leaving ? .02 * smooth(seg(t, HOLD, HOLD + .35)) - .02 * smooth(seg(t, HOLD + .9, HOLD + 1.2)) : 0);
   g.setAttribute('transform', `translate(${CX} ${CY}) scale(${s.toFixed(4)}) translate(${-CX} ${-CY})`);
  }
  let start = 0, running = false, frame = 0;
  const render = now => { pose(((now - start) / 1000) % LOOP); if (running) frame = requestAnimationFrame(render); };
  pose(FILL + 1);
  new IntersectionObserver(entries => {
   const visible = entries.some(e => e.isIntersecting);
   if (visible && !running) { running = true; start = performance.now(); frame = requestAnimationFrame(render); }
   else if (!visible && running) { running = false; cancelAnimationFrame(frame); }
  }).observe(svg);
 });
});

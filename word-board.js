(() => {
  const word = document.querySelector('.digital');
  if (!word) return;
  const wordSets = {en: ['digital', 'visual', 'brand', 'marketing'], ru: ['диджитал', 'бренд', 'маркетинг', 'граф']};
  let words = wordSets[document.documentElement.lang] || wordSets.en;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, timer, generation = 0;
  const glyphContext = document.createElement('canvas').getContext('2d');
  function fit() {
    const hero = document.querySelector('.hero-canvas');
    const bounds = hero.getBoundingClientRect();
    const first = hero.querySelector('.ai-coded');
    const last = hero.querySelector('.designer');
    [first, last].forEach(el => { el.style.top = ''; el.style.left = ''; el.style.fontSize = ''; el.style.whiteSpace = ''; });
    // On phones and tablets the heading column starts under the sun in the header and ends with the header.
    const stacked = innerWidth <= 800;
    const knob = stacked && hero.querySelector('.header .header-actions .theme-toggle');
    const header = hero.querySelector('.header');
    if (knob && knob.offsetWidth) first.style.left = last.style.left = `${knob.getBoundingClientRect().left-bounds.left}px`;
    const anchor = first.getBoundingClientRect();
    const lastBounds = last.getBoundingClientRect();
    word.style.left = `${anchor.left-bounds.left}px`;
    word.style.fontSize = '';
    const style = getComputedStyle(word);
    const context = document.createElement('canvas').getContext('2d');
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const russian = document.documentElement.lang === 'ru';
    // On phones and tablets both languages get one size and one rhythm for all three lines,
    // stacked in a column to the right of the location note.
    const phone = innerWidth <= 600;
    const uniform = russian || stacked;
    const longest = Math.max(...[...words, ...(uniform ? [first.textContent, last.textContent] : [])].map(text => context.measureText(text).width));
    const available = (knob && knob.offsetWidth ? header.getBoundingClientRect().right : bounds.right-20)-anchor.left;
    const size = parseFloat(style.fontSize)*Math.min(1, available/longest);
    word.style.fontSize = `${size}px`;
    if (uniform) {
      first.style.fontSize = `${size}px`;
      last.style.fontSize = `${size}px`;
      first.style.whiteSpace = last.style.whiteSpace = 'nowrap';
    }
    const middleHeight = word.getBoundingClientRect().height;
    word.style.top = `${(first.getBoundingClientRect().bottom+last.getBoundingClientRect().top-middleHeight)/2-bounds.top}px`;
    // The location note wraps before it can run into the last line of the heading.
    const place = hero.querySelector('.location');
    if (place) {
      place.style.maxWidth = '';
      const box = place.getBoundingClientRect(), placeStyle = getComputedStyle(place);
      const room = last.getBoundingClientRect().left - box.left - 16;
      const inset = placeStyle.boxSizing === 'border-box' ? 0 : parseFloat(placeStyle.paddingLeft) + parseFloat(placeStyle.paddingRight);
      if (room > 0 && room < box.width) place.style.maxWidth = `${room - inset}px`;
    }
    // The last line sits on the baseline of the location note's last line.
    const baseline = el => {
      const probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      el.append(probe); const y = probe.getBoundingClientRect().top; probe.remove(); return y;
    };
    const note = hero.querySelector('.location span') || hero.querySelector('.location');
    // the AI credit on the video shares that baseline on wider screens (on phones it sits on the video's bottom edge)
    const credit = hero.querySelector('.hero-ai-note');
    if (credit) { credit.style.top = credit.style.bottom = ''; }
    if (credit && note && !phone) {
      const top = credit.getBoundingClientRect().top - bounds.top + baseline(note) - baseline(credit);
      credit.style.bottom = 'auto';
      credit.style.top = `${top}px`;
    }
    const shift = note ? baseline(note) - baseline(last) : 0;
    const lastTop = last.getBoundingClientRect().top - bounds.top + shift;
    if (stacked) {
      const step = size*1.12;
      last.style.top = `${lastTop}px`;
      word.style.top = `${lastTop-step}px`;
      first.style.top = `${lastTop-2*step}px`;
    } else if (Math.abs(shift) > .5 && Math.abs(shift) < 150) {
      first.style.top = `${first.getBoundingClientRect().top - bounds.top + shift}px`;
      last.style.top = `${lastTop}px`;
      word.style.top = `${(first.getBoundingClientRect().bottom+last.getBoundingClientRect().top-middleHeight)/2-bounds.top}px`;
    }
    const fitted = getComputedStyle(word);
    glyphContext.font = `${fitted.fontWeight} ${fitted.fontSize} ${fitted.fontFamily}`;

  }
  function makeLetter(character) {
    const slot = document.createElement('span');
    slot.className = 'board-letter is-settled';
    slot.setAttribute('aria-hidden','true');
    slot.append(makeFace(character));
    return slot;
  }
  function makeFace(character) {
    const face = document.createElement('b');
    face.className = 'board-face';
    face.textContent = character;
    return face;
  }
  function settle() {
    word.replaceChildren(...[...words[index]].map(makeLetter));
    word.setAttribute('aria-label', words[index]);
    fit();
  }
  function schedule() {
    if (!document.hidden && !reduced.matches) timer = setTimeout(transition, 1500);
  }
  // em width of one glyph at the fitted size
  function glyphWidth(character) {
    const fitted = getComputedStyle(word);
    return character ? (glyphContext.measureText(character).width + (parseFloat(fitted.letterSpacing)||0)) / parseFloat(fitted.fontSize) : 0;
  }
  // Slot-machine reels: each letter spins through random glyphs and lands with a small bounce, left to right.
  function transition() {
    const previous = words[index];
    index = (index+1)%words.length;
    const target = words[index], token = ++generation;
    const pool = [...new Set(words.join(''))];
    const runs = [];
    word.replaceChildren(...[...Array(Math.max(previous.length, target.length))].map((_, i) => {
      const old = previous[i]||'', next = target[i]||'';
      const duration = 620 + i*70, delay = i*35;
      // the cell clips its reel and eases its width from the old glyph to the new one
      const cell = makeLetter('');
      cell.classList.add('reel-cell');
      cell.firstElementChild.remove();
      cell.animate([{ width: `${glyphWidth(old)}em` }, { width: `${glyphWidth(next)}em` }], { duration, delay, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'both' });
      const strip = document.createElement('span');
      strip.className = 'reel-strip';
      const glyphs = [old, ...Array.from({ length: 4 + i }, () => pool[Math.random()*pool.length|0]), next];
      strip.append(...glyphs.map(makeFace));
      cell.append(strip);
      runs.push(strip.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-(glyphs.length-1)*1.5}em)` }], { duration, delay, easing: 'cubic-bezier(.3,0,.3,1.25)', fill: 'both' }).finished);
      return cell;
    }));
    word.setAttribute('aria-label', target);
    const done = () => { if (token !== generation) return; settle(); schedule(); };
    Promise.all(runs).then(done, done);
  }
  function reset() {
    clearTimeout(timer); generation++;
    settle(); schedule();
  }
  document.addEventListener('portfolio-language-change', () => {
    words = wordSets[document.documentElement.lang] || wordSets.en;
    index = 0; reset();
  });
  addEventListener('resize', fit);
  document.fonts.ready.then(fit);
  document.addEventListener('visibilitychange', reset);
  reduced.addEventListener('change', reset);
  settle(); schedule();
})();

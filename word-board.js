(() => {
  const word = document.querySelector('.digital');
  if (!word) return;
  const wordSets = {en: ['digital', 'visual', 'brand', 'marketing'], ru: ['диджитал', 'бренд', 'маркетинг', 'граф']};
  let words = wordSets[document.documentElement.lang] || wordSets.en;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, timer, frame, generation = 0;
  const glyphContext = document.createElement('canvas').getContext('2d');
  function fit() {
    const hero = document.querySelector('.hero-canvas');
    const bounds = hero.getBoundingClientRect();
    const first = hero.querySelector('.ai-coded');
    const last = hero.querySelector('.designer');
    [first, last].forEach(el => { el.style.top = ''; el.style.left = ''; el.style.fontSize = ''; el.style.whiteSpace = ''; });
    const anchor = first.getBoundingClientRect();
    const lastBounds = last.getBoundingClientRect();
    word.style.left = `${anchor.left-bounds.left}px`;
    word.style.fontSize = '';
    const style = getComputedStyle(word);
    const context = document.createElement('canvas').getContext('2d');
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const russian = document.documentElement.lang === 'ru';
    // On phones both languages get one size and one rhythm for all three lines.
    const phone = innerWidth <= 600;
    const uniform = russian || phone;
    const longest = Math.max(...[...words, ...(uniform ? [first.textContent, last.textContent] : [])].map(text => context.measureText(text).width));
    const available = bounds.right-anchor.left-20;
    const size = parseFloat(style.fontSize)*Math.min(1, available/longest);
    word.style.fontSize = `${size}px`;
    if (uniform) {
      first.style.fontSize = `${size}px`;
      last.style.fontSize = `${size}px`;
      first.style.whiteSpace = last.style.whiteSpace = 'nowrap';
    }
    const middleHeight = word.getBoundingClientRect().height;
    word.style.top = `${(first.getBoundingClientRect().bottom+last.getBoundingClientRect().top-middleHeight)/2-bounds.top}px`;
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
    if (phone) {
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
  const ease = t => .5-Math.cos(Math.PI*Math.max(0,Math.min(1,t)))/2;
  function makeLetter(character) {
    const slot = document.createElement('span');
    slot.className = 'board-letter is-settled';
    slot.setAttribute('aria-hidden','true');
    const face = document.createElement('b');
    face.className = 'board-face';
    face.textContent = character;
    slot.append(face);
    return slot;
  }
  function settle() {
    word.replaceChildren(...[...words[index]].map(makeLetter));
    word.setAttribute('aria-label', words[index]);
    fit();
  }
  function schedule() {
    if (!document.hidden && !reduced.matches) timer = setTimeout(transition, 1500);
  }
  function transition() {
    const previous = words[index];
    index = (index+1)%words.length;
    const target = words[index], token = ++generation;
    // Keep the existing letters in place; only append genuinely new positions.
    while(word.children.length < target.length) word.append(makeLetter(''));
    fit();
    const style = getComputedStyle(word);
    const fontSize = parseFloat(style.fontSize);
    const tracking = parseFloat(style.letterSpacing)||0;
    const widthOf = char => char ? (glyphContext.measureText(char).width+tracking)/fontSize : 0;
    const slots = [...word.children].map((slot,i) => ({
      slot, face:slot.firstElementChild, old:previous[i]||'', next:target[i]||'',
      from:widthOf(previous[i]), to:widthOf(target[i]), delay:i*125
    }));
    const start=performance.now();
    function animate(now) {
      if(token!==generation)return;
      const elapsed=now-start;
      slots.forEach(({slot,face,old,next,from,to,delay})=>{
        const local=elapsed-delay;
        const duration=620;
        const progress=Math.max(0,Math.min(1,local/duration));
        const turning=local>0&&local<duration;
        // A full flip starts from the old glyph and finishes on the new one.
        const cycles=2;
        const phase=progress*cycles;
        const fraction=phase%1;
        face.textContent=progress===1?next:progress===0?old:(fraction<.5?old:next)||old||next;
        const angle=turning?(fraction<.5?-180*fraction:180*(1-fraction)):0;
        face.style.transform=`perspective(500px) rotateX(${angle}deg)`;
        const wide=Math.max(from,to);
        const width=progress<.5?from+(wide-from)*ease(progress*2):wide+(to-wide)*ease((progress-.5)*2);
        slot.style.width=`${width}em`;
        slot.style.opacity=old&&next?'1':String(old?1-ease(progress):ease(progress));
        slot.className=`board-letter ${turning?'is-turning':'is-settled'}`;
      });
      if(elapsed>=620+(slots.length-1)*125) {
        slots.forEach(({slot,face,next})=>{
          if(!next){slot.remove();return;}
          face.textContent=next;face.style.transform='';
          slot.style.width='';slot.style.opacity='';slot.className='board-letter is-settled';
        });
        word.setAttribute('aria-label',target);fit();schedule();
      } else frame=requestAnimationFrame(animate);
    }
    frame=requestAnimationFrame(animate);
  }
  function reset() {
    clearTimeout(timer); cancelAnimationFrame(frame); generation++;
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

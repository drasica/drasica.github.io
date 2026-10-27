(() => {
  const anchor = document.querySelector('.menu-anchor');
  const button = anchor.querySelector('.menu-toggle');
  const panel = document.querySelector('#site-menu');
  function sizeMenu() {
    if (panel.hidden) return;
    // the open pill fits every link plus its own controls, so nothing scrolls on a wide screen
    const style = getComputedStyle(anchor);
    const items = [...anchor.children].filter(el => el !== panel && getComputedStyle(el).display !== 'none');
    const controls = items.reduce((sum, el) => sum + el.getBoundingClientRect().width, 0);
    const gaps = (parseFloat(style.columnGap) || 0) * items.length;
    const frame = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    const contentWidth = panel.querySelector('nav').scrollWidth;
    anchor.style.setProperty('--menu-open-width', `${Math.ceil(contentWidth + controls + gaps + frame + 8)}px`);
  }
  function close(restoreFocus = false) {
    panel.hidden = true;
    anchor.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button.focus({preventScroll: true});
  }
  button.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    anchor.classList.toggle('is-open', open);
    if (open) sizeMenu();
    button.setAttribute('aria-expanded', String(open));
  });
  panel.addEventListener('click', event => {
    if (event.target.closest('a[href]')) close(true);
  });
  document.addEventListener('click', event => {
    if (!anchor.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) close(true);
  });
  anchor.addEventListener('focusout', event => {
    if (event.relatedTarget && !anchor.contains(event.relatedTarget)) close();
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false, visible = false, motion;
  anchor.classList.add('is-docked');
  // Match the reference: 120px, 600ms, GSAP back.out(1.4).
  const entrance = Array.from({length: 61}, (_, i) => {
    const t = i / 60, u = t - 1;
    const eased = 1 + 2.4 * u * u * u + 1.4 * u * u;
    return {offset: t, translate: `0 ${120 * (1 - eased)}px`, opacity: Math.min(1, Math.max(0, eased))};
  });
  const departure = Array.from({length: 41}, (_, i) => {
    const t = i / 40, eased = t ** 4;
    return {offset: t, translate: `0 ${120 * eased}px`, opacity: 1 - eased};
  });
  function setVisible(show) {
    if (visible === show) return;
    visible = show;
    motion?.cancel();
    anchor.inert = !show;
    if (show) anchor.hidden = false;
    else close();
    if (reduced.matches) { anchor.hidden = !show; return; }
    motion = anchor.animate(show ? entrance : departure, {
      duration: show ? 600 : 400, easing: 'linear', fill: 'both'
    });
    motion.onfinish = () => { if (!visible) anchor.hidden = true; };
  }
  function position() {
    const footerVisible = document.querySelector('#contact').getBoundingClientRect().top < innerHeight;
    if (footerVisible) setVisible(false);
    else if (scrollY > 50) setVisible(true);
    else if (scrollY < 10) setVisible(false);
    pending = false;
  }
  window.addEventListener('scroll', () => {
    if (!pending) { pending = true; requestAnimationFrame(position); }
  }, {passive: true});
  window.addEventListener('resize', position);

  function label() {
    button.setAttribute('aria-label', document.documentElement.lang === 'ru' ? 'Открыть навигацию' : 'Open navigation');
  }
  new MutationObserver(label).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  window.addEventListener('resize', sizeMenu);
  document.fonts.ready.then(sizeMenu);
  new MutationObserver(sizeMenu).observe(panel, {subtree:true, childList:true, characterData:true});
  // the header's own menu button (phones and tablets) brings the menu pill in and opens it
  const headerMenus = document.querySelectorAll('.header-menu');
  headerMenus.forEach(open => open.addEventListener('click', event => {
    event.stopPropagation();
    setVisible(true);
    if (panel.hidden) button.click();
  }));
  new MutationObserver(() => headerMenus.forEach(b => b.setAttribute('aria-label', document.documentElement.lang === 'ru' ? 'Открыть навигацию' : 'Open navigation')))
    .observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  // the folded pill offers "contact me" in place of the language switch, which comes back once it opens
  const contact = document.createElement('a');
  contact.className = 'menu-contact';
  contact.href = '#contact';
  anchor.querySelector('.menu-logo').after(contact);
  const contactLabel = () => { contact.textContent = window.portfolioTranslations?.text2?.[document.documentElement.lang === 'ru' ? 'ru' : 'en'] || 'contact me'; };
  new MutationObserver(contactLabel).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  contactLabel();
  label(); position();
})();

(() => {
  let language = 'en';
  language = window.portfolioStartLanguage?.() || 'en';
  function translate(next, persist = true) {
    language = next;
    document.documentElement.lang = next;
    document.querySelectorAll('[data-en]').forEach(el => el.textContent = el.dataset[next]);
    document.querySelectorAll('[data-emphasis-ru]').forEach(el => {
      const phrase = next === 'ru' ? el.dataset.emphasisRu : el.dataset.emphasisEn;
      const value = el.textContent;
      const start = value.indexOf(phrase);
      if (start < 0) return;
      const emphasis = document.createElement('span');
      emphasis.className = 'case-' + el.dataset.emphasisTone;
      emphasis.textContent = phrase;
      el.replaceChildren(document.createTextNode(value.slice(0, start)), emphasis, document.createTextNode(value.slice(start + phrase.length)));
    });
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const value = window.portfolioTranslations?.[el.dataset.i18n]?.[next];
      if (value) el.textContent = value;
    });
    document.querySelectorAll('.language').forEach(el => {
      el.textContent = next === 'ru' ? 'ru' : 'en';
      el.setAttribute('aria-label', next === 'ru' ? 'Switch to English' : 'Переключить на русский');
      el.setAttribute('aria-pressed', String(next === 'ru'));
    });
    window.applyRussianTypography?.();
    if (persist) { try { localStorage.setItem('portfolio-language', next); } catch {} }
  }
  document.querySelectorAll('.language').forEach(el => el.addEventListener('click', () => translate(language === 'ru' ? 'en' : 'ru')));
  document.querySelectorAll('[data-link]').forEach(el => {
    const href = window.portfolioLinks?.[el.dataset.link];
    if (href) { el.href = href; el.removeAttribute('aria-disabled'); }
  });
  translate(language, false);
})();

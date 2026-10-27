const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let language = 'en';
let currentFilter = 'All';
language = window.portfolioStartLanguage?.() || 'en';

$$('[data-link]').forEach(link => {
  const target = window.portfolioLinks?.[link.dataset.link];
  if (target) {
    link.href = target;
    link.removeAttribute('aria-disabled');
    link.removeAttribute('title');
    if (target.startsWith('https://')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  }
});

function updateFilter(announce = true) {
  let visible = 0;
  $$('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === currentFilter)));
  $$('.project').forEach(project => {
    project.hidden = currentFilter !== 'All' && !project.dataset.tags.split(' · ').includes(currentFilter);
    project.removeAttribute('data-layout');
    if (!project.hidden) project.dataset.layout = String(visible++);
  });
  $('.project-grid').classList.toggle('is-filtered', currentFilter !== 'All');
  if (announce) $('#filter-status').textContent = language === 'ru' ? `Показано проектов: ${visible}` : `${visible} projects shown`;
}

function setLanguage(next, persist = true) {
  language = next;
  document.documentElement.lang = next;
  $$('[data-i18n]').forEach(el => { el.textContent = window.portfolioTranslations[el.dataset.i18n][next]; });
  $$('[data-i18n-alt]').forEach(el => { const text = window.portfolioAltTranslations[el.dataset.i18nAlt][next]; el.tagName === 'IMG' ? el.alt = text : el.setAttribute('aria-label', text); });
  $$('.language').forEach(toggle => {
  toggle.textContent = next === 'en' ? 'en' : 'ru';
  toggle.setAttribute('aria-label', next === 'en' ? 'Switch to Russian' : 'Переключить на английский');
  toggle.setAttribute('aria-pressed', String(next === 'ru'));
  });
  document.title = next === 'en' ? 'Daria Kapustina — Digital Designer' : 'Дарья Капустина — Диджитал-дизайнер';
  $('meta[name="description"]').content = next === 'en' ? 'Daria Kapustina — branding, marketing and AI-driven digital design.' : 'Дарья Капустина — брендинг, маркетинг и диджитал-дизайн с AI.';
  const labels = [
    ['.hero', 'Daria Kapustina, digital designer', 'Дарья Капустина, диджитал-дизайнер'],
    ['.header nav', 'Main navigation', 'Основная навигация'],
    ['.filter-buttons', 'Filter projects', 'Фильтры проектов'],
    ['.footer-inner nav', 'Footer navigation', 'Навигация внизу страницы'],
    ['.social-links', 'Social profiles', 'Социальные сети']
  ];
  labels.forEach(([selector,en,ru]) => $(selector).setAttribute('aria-label',next === 'en' ? en : ru));
  $$('[data-link][aria-disabled="true"]').forEach(link => {
    link.title = next === 'en' ? (link.dataset.link === 'cv' ? 'CV will be added soon' : 'Email will be added soon') : (link.dataset.link === 'cv' ? 'Резюме скоро появится' : 'Email скоро появится');
  });
  if (persist) { try { localStorage.setItem('portfolio-language', next); } catch {} }
  const heroTitle = $('.hero h1');
  const order = ['.ai-coded', '.digital', '.designer'];
  order.forEach(selector => heroTitle.append($(selector)));
  window.applyRussianTypography?.();
  document.dispatchEvent(new Event('portfolio-language-change'));
  updateFilter(false);
  if ($('#filter-status').textContent) updateFilter();
}

$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter;
  updateFilter();
}));
$$('.language').forEach(toggle => toggle.addEventListener('click', () => setLanguage(language === 'en' ? 'ru' : 'en')));
setLanguage(language, false);

// Project previews further down start loading only when they come near the screen,
// so on a slow connection the first screen gets the bandwidth.
$$('video[data-src]').forEach(video => {
  const load = () => { video.src = video.dataset.src; video.removeAttribute('data-src'); video.play().catch(() => {}); };
  if (!('IntersectionObserver' in window)) return load();
  const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: '600px 0px' });
  io.observe(video);
});

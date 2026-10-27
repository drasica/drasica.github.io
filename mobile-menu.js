// Phones: the docked menu pill opens a white sheet of grouped links above it (layout after maxshirko.me).
(() => {
  const anchor = document.querySelector('.menu-anchor');
  if (!anchor) return;
  const root = document.documentElement;
  const onHome = !!document.querySelector('#experience');
  const at = id => (onHome ? '' : 'index.html') + '#' + id;
  const page = location.pathname.split('/').pop() || 'index.html';
  const href = sel => document.querySelector(sel)?.getAttribute('href') || '#contact';
  const T = {
    en: { nav: 'Navigation', projects: 'Projects', contact: 'Contact', social: 'Social', home: 'home', experience: 'experience', all: 'all projects', about: 'about', soon: 'soon', write: 'Contact me' },
    ru: { nav: 'Навигация', projects: 'Проекты', contact: 'Связаться', social: 'Соцсети', home: 'главная', experience: 'опыт', all: 'все проекты', about: 'обо мне', soon: 'скоро', write: 'Связаться со мной' },
  };
  const PROJECTS = [['tanu.html', 'TANU'], ['proriski.html', 'ProRiski'], ['enta.html', 'MPP × ENTA'], ['aurus.html', 'Aurus'], ['leaf-tower.html', 'Leaf Tower'], ['penthouse.html', 'Penthouse']];
  const ext = ' target="_blank" rel="noopener noreferrer"';
  const link = (url, text, extra = '') => `<a class="mm-link" href="${url}"${extra}>${text}</a>`;

  const sheet = document.createElement('div');
  sheet.className = 'mm-sheet';
  sheet.innerHTML = `
    <div class="mm-col"><p class="mm-label" data-k="nav"></p>
      ${link(at('home'), '', ' data-k="home"')}${link(at('experience'), '', ' data-k="experience"')}${link(at('projects'), '', ' data-k="all"')}${link(at('about'), '', ' data-k="about"')}</div>
    <div class="mm-col"><p class="mm-label" data-k="projects"></p>
      ${PROJECTS.map(([url, name]) => link(url, name, url === page ? ' aria-current="page"' : '')).join('')}</div>
    <div class="mm-col"><p class="mm-label" data-k="contact"></p>
      ${link(href('.contact-actions a[href^="mailto"]'), 'E‑Mail')}${link(href('.contact-actions a[href*="t.me"]'), 'Telegram', ext)}<a class="mm-link" data-link="cv">cv <small data-k="soon"></small></a></div>
    <div class="mm-col"><p class="mm-label" data-k="social"></p>
      ${link(href('.social-instagram'), 'Instagram', ext)}${link(href('.social-threads'), 'Threads', ext)}${link(href('.social-linkedin'), 'LinkedIn', ext)}</div>`;
  anchor.append(sheet);

  // phones: an envelope in place of the header burger, leading down to the contact footer
  document.querySelectorAll('.header .header-menu').forEach(menu => {
    const plane = document.createElement('a');
    plane.className = 'header-contact';
    plane.href = '#contact';
    plane.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m6.5 9.5 4.3 3.1a2 2 0 0 0 2.4 0l4.3-3.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    menu.after(plane);
  });

  sheet.addEventListener('click', event => {
    if (event.target.closest('a[href]') && anchor.classList.contains('is-open')) anchor.querySelector('.menu-toggle').click();
  });
  const sync = () => {
    const t = T[root.lang === 'ru' ? 'ru' : 'en'];
    sheet.querySelectorAll('[data-k]').forEach(el => { el.textContent = t[el.dataset.k]; });
    document.querySelectorAll('.header-contact').forEach(a => a.setAttribute('aria-label', t.write));
  };
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['lang'] });
  sync();
})();

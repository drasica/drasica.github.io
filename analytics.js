// Visit statistics (Umami): how far people get on each page and what they click.
// The tracker itself only counts on drasica.github.io (data-domains), so local previews stay out of the numbers.
(() => {
  // Clarity (visit recordings and heatmaps), live site only.
  if (location.hostname === 'drasica.github.io') {
    window.clarity = window.clarity || function () { (clarity.q = clarity.q || []).push(arguments); };
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.clarity.ms/tag/z4rjvzpiab';
    document.head.append(tag);
  }

  const queue = [];
  const send = (name, data) => {
    // the same events mark Clarity recordings, so they can be filtered by them
    window.clarity?.('event', name);
    if (window.umami?.track) umami.track(name, data);
    else queue.push([name, data]);
  };
  const flush = () => { while (window.umami?.track && queue.length) umami.track(...queue.shift()); };
  const tracker = document.querySelector('script[data-website-id]');
  tracker?.addEventListener('load', flush);
  flush();

  const onHome = !!document.querySelector('#experience');

  // Home: which blocks were reached — scrolled up to the middle of the screen, or the page bottom hit
  // (each counted once per page view).
  if (onHome) {
    const blocks = [['intro', '#intro'], ['projects', '#projects'], ['experience', '#experience'], ['about', '#about'], ['more', '.more'], ['contact', '#contact']]
      .map(([name, selector]) => [name, document.querySelector(selector)]).filter(([, el]) => el);
    const check = () => {
      const bottom = scrollY >= document.documentElement.scrollHeight - innerHeight - 2;
      while (blocks.length && (bottom || blocks[0][1].getBoundingClientRect().top < innerHeight / 2)) send(`reached ${blocks.shift()[0]}`);
      if (!blocks.length) removeEventListener('scroll', check);
    };
    addEventListener('scroll', check, { passive: true });
  } else {
    // Case pages: how much of the page was scrolled through.
    const marks = [25, 50, 75, 100];
    const check = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (max <= 0) return;
      const depth = (scrollY / max) * 100;
      while (marks.length && depth >= marks[0] - 2) send(`read ${marks.shift()}%`);
      if (!marks.length) removeEventListener('scroll', check);
    };
    addEventListener('scroll', check, { passive: true });
  }

  // Clicks that matter: opening a case, the CV, contacts and socials, language and theme.
  const cases = { 'tanu': 'TANU', 'proriski': 'ProRiski', 'enta': 'MPP × ENTA', 'aurus': 'Aurus', 'leaf-tower': 'Leaf Tower', 'penthouse': 'Penthouse' };
  document.addEventListener('click', event => {
    const target = event.target.closest('a, button');
    if (!target) return;
    const lang = document.documentElement.lang === 'ru' ? 'ru' : 'en';
    const href = target.getAttribute('href') || '';
    const page = href.match(/^(?:\.\/)?([a-z-]+)\.html/)?.[1];
    if (target.matches('[data-link="cv"]')) {
      if (target.getAttribute('aria-disabled') !== 'true') send('cv', { lang });
    } else if (page && cases[page]) send('open case', { case: cases[page], from: onHome ? 'home' : 'case page' });
    else if (href.startsWith('mailto:')) send('email');
    else if (href.includes('t.me/')) send('telegram');
    else if (href.includes('linkedin.com')) send('linkedin');
    else if (href.includes('instagram.com')) send('instagram');
    else if (href.includes('threads.')) send('threads');
    else if (target.matches('.language')) send('switch language', { to: lang === 'ru' ? 'en' : 'ru' });
    else if (target.matches('.theme-toggle')) send('switch theme');
  }, true);
})();

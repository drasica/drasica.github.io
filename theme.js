(() => {
  const root = document.documentElement;
  let theme = 'light';
  try { if (localStorage.getItem('portfolio-theme') === 'dark') theme = 'dark'; } catch {}
  root.dataset.theme = theme;
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = [...document.querySelectorAll('.theme-toggle')];
    function sync() {
      const dark = root.dataset.theme === 'dark';
      const ru = root.lang === 'ru';
      buttons.forEach(button => {
        const label = ru ? (dark ? 'Включить светлую тему' : 'Включить тёмную тему') : (dark ? 'Switch to light theme' : 'Switch to dark theme');
        button.setAttribute('aria-label', label);
        button.setAttribute('aria-pressed', String(dark));
        button.title = label;
      });
    }
    buttons.forEach(button => button.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('portfolio-theme', root.dataset.theme); } catch {}
      sync();
    }));
    new MutationObserver(sync).observe(root, {attributes:true,attributeFilter:['lang']});
    window.addEventListener('storage', event => {
      if (event.key === 'portfolio-theme') { root.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light'; sync(); }
    });
    sync();
  });
})();

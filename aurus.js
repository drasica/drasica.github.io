(() => {
  const frames = document.querySelectorAll('.aurus-art');
  const resize = () => frames.forEach(frame => {
    frame.querySelector('.aurus-stage').style.transform = `scale(${frame.clientWidth / Number(frame.dataset.width)})`;
  });
  const observer = new ResizeObserver(resize);
  frames.forEach(frame => observer.observe(frame));
  resize();
})();

// The main-screen recording plays only once it is about a screen away.
document.querySelectorAll('video[data-src]').forEach(video => {
  const load = () => { video.autoplay = true; video.src = video.dataset.src; video.removeAttribute('data-src'); };
  if (!('IntersectionObserver' in window)) return load();
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); }
  }, { rootMargin: '100% 0px' });
  observer.observe(video);
});

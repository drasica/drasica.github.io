// Phones suspend background videos after a page sits idle for a while and do not always restart them.
// Muted autoplay videos are woken up again when the page comes back and when they scroll into view;
// a video that failed to load is reloaded from where it was.
(() => {
  const autoplaying = () => [...document.querySelectorAll('video')].filter(video => video.autoplay && video.muted && video.currentSrc);
  const visible = video => {
    const box = video.getBoundingClientRect();
    return box.bottom > -200 && box.top < innerHeight + 200 && box.width > 0;
  };
  const revive = video => {
    // play() alone restarts a download that was merely put to sleep; a failed one needs a fresh load
    if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      const at = video.currentTime;
      video.load();
      if (at) video.addEventListener('loadedmetadata', () => { video.currentTime = at; }, { once: true });
    }
    if (video.paused) video.play().catch(() => {});
  };
  const wake = () => autoplaying().filter(visible).forEach(revive);

  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  addEventListener('pageshow', wake);
  addEventListener('focus', wake);

  // in view again → playing again
  const watcher = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting && entry.target.autoplay && entry.target.muted && entry.target.currentSrc) revive(entry.target);
  }), { rootMargin: '200px 0px' });
  const watch = () => document.querySelectorAll('video').forEach(video => watcher.observe(video));
  watch();
  addEventListener('load', watch);

  // a stalled or failed download gets one more try a moment later
  document.addEventListener('error', event => {
    const video = event.target.closest?.('video');
    if (!video || video.dataset.retried) return;
    video.dataset.retried = '1';
    setTimeout(() => { video.load(); if (video.autoplay) video.play().catch(() => {}); }, 1500);
  }, true);
  document.addEventListener('stalled', event => {
    const video = event.target;
    if (!(video instanceof HTMLVideoElement)) return;
    setTimeout(() => { if (!document.hidden && video.readyState < 3 && visible(video)) revive(video); }, 4000);
  }, true);
})();

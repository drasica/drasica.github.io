// Native touch scrolling; pointer capture adds mouse dragging without image ghosts.
document.querySelectorAll('.campaign-track').forEach(track => {
 let drag = null;
 track.addEventListener('dragstart', event => event.preventDefault());
 track.addEventListener('pointerdown', event => {
  if(event.pointerType !== 'mouse' || event.button !== 0 || track.scrollWidth <= track.clientWidth) return;
  drag = {x:event.clientX,scroll:track.scrollLeft,id:event.pointerId};
  track.setPointerCapture(event.pointerId);
  track.classList.add('is-dragging');
  event.preventDefault();
 });
 track.addEventListener('pointermove', event => {
  if(drag) track.scrollLeft = drag.scroll + drag.x - event.clientX;
 });
 const finish = () => { drag=null;track.classList.remove('is-dragging'); };
 track.addEventListener('pointerup',finish);
 track.addEventListener('pointercancel',finish);
 track.addEventListener('lostpointercapture',finish);
});

// Campaign film autoplays muted on a loop; the button toggles sound.
document.querySelectorAll('.pro-film-wrap').forEach(wrap => {
 const video = wrap.querySelector('video');
 const button = wrap.querySelector('.pro-film-sound');
 button.addEventListener('click', () => {
  video.muted = !video.muted;
  if(!video.muted) video.play();
  button.setAttribute('aria-pressed', String(!video.muted));
  button.setAttribute('aria-label', video.muted ? button.dataset.labelOff : button.dataset.labelOn);
 });
});

// The film sits at the bottom of the page: fetch it only when it is about a screen away.
document.querySelectorAll('video[data-src]').forEach(video => {
 const load = () => { video.autoplay = true; video.src = video.dataset.src; video.removeAttribute('data-src'); };
 if(!('IntersectionObserver' in window)) return load();
 const observer = new IntersectionObserver(entries => {
  if(entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); }
 }, {rootMargin: '100% 0px'});
 observer.observe(video);
});

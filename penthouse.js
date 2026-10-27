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

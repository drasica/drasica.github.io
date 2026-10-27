(() => {
 const tabs = [...document.querySelectorAll('.landing-tabs [role="tab"]')];
 const compact = window.matchMedia('(max-width: 700px)');
 const select = tab => {
  tabs.forEach(button => {
   const active = button === tab;
   button.setAttribute('aria-selected', String(active));
   button.tabIndex = active ? 0 : -1;
   const panel = document.getElementById(button.getAttribute('aria-controls'));
   panel.hidden = compact.matches && !active;
   panel.setAttribute('role', compact.matches ? 'tabpanel' : 'group');
   panel.tabIndex = compact.matches ? 0 : -1;
  });
 };
 compact.addEventListener('change', () => select(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]));
 select(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
 tabs.forEach((tab,index) => {
  tab.addEventListener('click', () => select(tab));
  tab.addEventListener('keydown', event => {
   let next;
   if(event.key === 'ArrowRight') next = (index+1)%tabs.length;
   if(event.key === 'ArrowLeft') next = (index+tabs.length-1)%tabs.length;
   if(event.key === 'Home') next = 0;
   if(event.key === 'End') next = tabs.length-1;
   if(next === undefined) return;
   event.preventDefault(); select(tabs[next]); tabs[next].focus();
  });
 });
})();
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

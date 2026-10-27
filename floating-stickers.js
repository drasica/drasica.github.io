(() => {
  const layer = document.querySelector('.hero-orbit');
  if (!layer) return;
  const hero = document.querySelector('.hero-canvas');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  layer.classList.add('is-floating');
  layer.removeAttribute('aria-hidden');
  const names = ['TANU', 'Aurus', 'Portrait', 'ProRiski'];
  const angles = [19.51, 3.62, -2.5, 19.51];
  let width = hero.clientWidth, height = hero.clientHeight, frame = 0, lastTime = 0;
  // area: the cream background only — never over the photo (a video will play there later)
  let area = {left:0, top:0, right:0, bottom:0}, obstacles = [];
  function measure() {
    const origin = hero.getBoundingClientRect();
    width = hero.clientWidth; height = hero.clientHeight;
    const photo = document.querySelector('.hero-photo').getBoundingClientRect();
    const stacked = matchMedia('(max-width:600px)').matches;
    area = stacked
      ? {left:0, top:photo.bottom-origin.top, right:width, bottom:height}
      : {left:photo.right-origin.left, top:0, right:width, bottom:height};
    obstacles = [...hero.querySelectorAll('.header, h1 > span, .location')].map(el => {
      const r = el.getBoundingClientRect();
      return {left:r.left-origin.left, right:r.right-origin.left, top:r.top-origin.top, bottom:r.bottom-origin.top};
    });
  }
  measure();
  function constrain(item) {
    // The diagonal radius includes rotated corners, with a little breathing room.
    const padding = item.size*(Math.SQRT2-1)/2+8;
    const minX=area.left+padding, maxX=area.right-item.size-padding;
    const minY=area.top+padding, maxY=area.bottom-item.size-padding;
    const x=clamp(item.x,minX,maxX), y=clamp(item.y,minY,maxY);
    if(x!==item.x)item.vx*=-.7;
    if(y!==item.y)item.vy*=-.7;
    item.x=x;item.y=y;
  }
  function repel(item,dt) {
    const cx=item.x+item.size/2,cy=item.y+item.size/2;
    const radius=item.size*.71+18;
    for(const r of obstacles) {
      const box={left:r.left-radius,right:r.right+radius,top:r.top-radius,bottom:r.bottom+radius};
      if(cx<=box.left||cx>=box.right||cy<=box.top||cy>=box.bottom)continue;
      const exits=[
        {d:cx-box.left,x:-1,y:0,valid:box.left>area.left+item.size/2+8},
        {d:box.right-cx,x:1,y:0,valid:box.right<area.right-item.size/2-8},
        {d:cy-box.top,x:0,y:-1,valid:box.top>area.top+item.size/2+8},
        {d:box.bottom-cy,x:0,y:1,valid:box.bottom<area.bottom-item.size/2-8}
      ].filter(e=>e.valid).sort((a,b)=>a.d-b.d);
      const exit=exits[0];
      if(!exit)continue;
      const force=260+Math.min(exit.d,100)*3;
      item.vx+=exit.x*force*dt;item.vy+=exit.y*force*dt;
    }
    // stickers keep a little distance from each other instead of piling up in one free spot
    for(const other of items) {
      if(other===item)continue;
      const dx=cx-(other.x+other.size/2),dy=cy-(other.y+other.size/2),dist=Math.hypot(dx,dy)||1,min=(item.size+other.size)*.75;
      if(dist<min){const f=(min-dist)*14*dt;item.vx+=dx/dist*f*10;item.vy+=dy/dist*f*10;}
    }
  }
  // Start spots: the free places of the cream area farthest from the text and from stickers already placed.
  function freeSpots(size) {
    const spots=[],pad=size*.71+10;
    for(let gy=area.top+pad;gy<=area.bottom-pad;gy+=10)for(let gx=area.left+pad;gx<=area.right-pad;gx+=10){
      let clear=Infinity;
      for(const r of obstacles){const dx=Math.max(r.left-gx,0,gx-r.right),dy=Math.max(r.top-gy,0,gy-r.bottom);clear=Math.min(clear,Math.hypot(dx,dy));}
      spots.push({x:gx,y:gy,clear});
    }
    return spots;
  }
  function pickSpot(size,placed) {
    let best=null,score=-Infinity;
    for(const s of freeSpots(size)){
      const near=placed.reduce((m,p)=>Math.min(m,Math.hypot(s.x-p.x,s.y-p.y)),Infinity);
      const v=Math.min(s.clear,40)+Math.min(near,size*3)*.6;
      if(v>score){score=v;best=s;}
    }
    return best?{x:best.x-size/2,y:best.y-size/2}:{x:area.left+12,y:area.top+12};
  }

  function move(item,x,y) {
    const startX=item.x,startY=item.y;
    const steps=Math.max(1,Math.ceil(Math.hypot(x-startX,y-startY)/6));
    const dx=(x-startX)/steps,dy=(y-startY)/steps;
    for(let i=0;i<steps;i++){item.x+=dx;item.y+=dy;constrain(item);}
  }
  const started = performance.now() + (window.__introDelay || 0);   // wait for the intro board, if it is showing
  const placed = [];
  const items = [];
  [...layer.children].forEach((el, i) => {
    const size = el.offsetWidth;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${names[i]} — drag to move, or use arrow keys`);
    const target = pickSpot(size, placed);
    placed.push({x:target.x+size/2,y:target.y+size/2});
    const item = {
      el, size, x: target.x, y: target.y, target, angle: angles[i],
      vx: [14,-12,10,-16][i], vy: [-10,8,12,-8][i],
      phase: i*1.7, pointer: null, launch: !reducedMotion.matches,
      launchX: clamp(area.left+(area.right-area.left)*(.15+i*.22),area.left+12,area.right-size-12),
      launchY: area.bottom-size-20,
      delay: i*140, started, lastX: 0, lastY: 0, lastMove: 0, offsetX: 0, offsetY: 0
    };
    const render = () => { el.style.transform = `translate3d(${item.x}px,${item.y}px,0) rotate(${item.angle}deg)`; };
    item.render = render;
    el.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      item.launch = false;
      item.pointer = event.pointerId;
      const origin=hero.getBoundingClientRect();
      item.offsetX = event.clientX-origin.left-item.x;
      item.offsetY = event.clientY-origin.top-item.y;
      item.lastX = event.clientX; item.lastY = event.clientY; item.lastMove = performance.now();
      item.vx = item.vy = 0;
      el.classList.add('is-dragging');
      el.setPointerCapture(event.pointerId);
    });
    el.addEventListener('pointermove', event => {
      if (event.pointerId !== item.pointer) return;
      const now = performance.now(), dt = Math.max((now-item.lastMove)/1000,.008);
      item.vx = clamp((event.clientX-item.lastX)/dt,-450,450);
      item.vy = clamp((event.clientY-item.lastY)/dt,-450,450);
      const origin=hero.getBoundingClientRect();
      move(item,event.clientX-origin.left-item.offsetX,event.clientY-origin.top-item.offsetY);
      item.lastX = event.clientX; item.lastY = event.clientY; item.lastMove = now;
      render();
    });
    const release = event => {
      if (event.pointerId !== item.pointer) return;
      if (performance.now()-item.lastMove>100 || event.type==='pointercancel') item.vx=item.vy=0;
      item.pointer=null;
      el.classList.remove('is-dragging');
      if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    };
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>el.addEventListener(type,release));
    el.addEventListener('keydown', event => {
      const directions = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      if (!directions[event.key]) return;
      event.preventDefault(); item.launch=false;
      const [dx,dy]=directions[event.key], step=event.shiftKey?40:12;
      move(item,item.x+dx*step,item.y+dy*step);
      item.vx=item.vy=0; render();
    });
    if (item.launch) { item.x=item.launchX; item.y=item.launchY; }
    constrain(item); render();
    items.push(item);
  });
  const labelStickers = () => items.forEach((item,i) => item.el.setAttribute('aria-label',
    document.documentElement.lang === 'ru'
      ? `${names[i]} — перетащите или перемещайте стрелками клавиатуры`
      : `${names[i]} — drag to move, or use arrow keys`));
  labelStickers();
  // When the text moves (fonts arrive, language switches), stickers sitting on it glide to free spots.
  const overText = item => obstacles.some(r => item.x+item.size>r.left-6 && item.x<r.right+6 && item.y+item.size>r.top-6 && item.y<r.bottom+6);
  function resettle(all) {
    measure();
    const placed = items.filter(item => !all && !overText(item)).map(item => ({x:item.x+item.size/2,y:item.y+item.size/2}));
    items.forEach(item => {
      if (item.pointer!==null || (!all && !overText(item))) return;
      if (!all && item.launch) return;
      item.target = pickSpot(item.size, placed); placed.push({x:item.target.x+item.size/2,y:item.target.y+item.size/2});
      if (reducedMotion.matches) { item.x=item.target.x; item.y=item.target.y; constrain(item); item.render(); return; }
      if (!item.launch) { item.launchX=item.x; item.launchY=item.y; item.started=performance.now(); item.delay=0; item.launch=true; }
    });
  }
  new MutationObserver(()=>{labelStickers();requestAnimationFrame(()=>resettle(false));}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('portfolio-language-change',()=>requestAnimationFrame(()=>resettle(false)));
  function tick(now) {
    const dt=Math.min((now-(lastTime||now))/1000,.032); lastTime=now;
    measure();
    items.forEach(item => {
      if(item.pointer!==null) return;
      if(item.launch) {
        const t=clamp((now-item.started-item.delay)/1800,0,1), ease=1-Math.pow(1-t,3);
        move(item,item.launchX+(item.target.x-item.launchX)*ease,item.launchY+(item.target.y-item.launchY)*ease);
        item.angle=angles[items.indexOf(item)]+Math.sin(t*Math.PI)*18;
        if(t===1)item.launch=false;
      } else if(!reducedMotion.matches) {
        // Low drag and gentle varying currents: no spring pulling back after a drag.
        const t=now/1000;
        item.vx+=Math.sin(t*.43+item.phase)*7*dt;
        item.vy+=Math.cos(t*.37+item.phase)*6*dt;
        repel(item,dt);
        const damping=Math.exp(-.42*dt); item.vx*=damping;item.vy*=damping;
        move(item,item.x+item.vx*dt,item.y+item.vy*dt);
        item.angle=angles[items.indexOf(item)]+Math.sin(t*.55+item.phase)*7;
      }
      item.render();
    });
    frame=requestAnimationFrame(tick);
  }
  function resize() {
    const oldW=width,oldH=height; measure();
    items.forEach(item=>{
      item.size=item.el.offsetWidth;item.launch=false;
      item.x=item.x/oldW*width;item.y=item.y/oldH*height;constrain(item);item.render();
    });
  }
  addEventListener('resize',resize);
  new ResizeObserver(()=>{if(width!==hero.clientWidth||height!==hero.clientHeight)resize();}).observe(hero);
  document.fonts.ready.then(()=>requestAnimationFrame(()=>resettle(true)));
  reducedMotion.addEventListener('change',()=>{items.forEach(item=>{item.launch=false;constrain(item);item.render();});});
  document.addEventListener('visibilitychange',()=>{
    cancelAnimationFrame(frame);lastTime=0;
    if(!document.hidden)frame=requestAnimationFrame(tick);
  });
  frame=requestAnimationFrame(tick);
})();

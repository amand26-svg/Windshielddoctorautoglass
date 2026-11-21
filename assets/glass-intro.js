/* Windshield Doctor — classic glass-shatter homepage intro. No dependencies or audio. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saver = navigator.connection && navigator.connection.saveData;
  const forcedPreview = new URLSearchParams(location.search).get('previewIntro') === '1';
  const storeKey = 'windshield-doctor-classic-intro-v1';
  const SPEED = 1.45;
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const easeOut = n => 1 - Math.pow(1 - clamp(n), 3);
  const easeInOut = n => { const v = clamp(n); return v * v * (3 - 2 * v); };
  const lerp = (a, b, v) => a + (b - a) * v;
  function makeRandom(seed) {
    return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  }
  function poly(ctx, points) {
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
  }
  function strokePartial(ctx, points, fraction) {
    const lengths = []; let total = 0;
    for (let i = 1; i < points.length; ++i) {
      const len = Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y);
      lengths.push(len); total += len;
    }
    let remaining = total * clamp(fraction);
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length && remaining > 0; ++i) {
      const step = Math.min(lengths[i-1], remaining);
      const v = lengths[i-1] ? step / lengths[i-1] : 0;
      ctx.lineTo(lerp(points[i-1].x, points[i].x, v), lerp(points[i-1].y, points[i].y, v));
      remaining -= step;
    }
    ctx.stroke();
  }

  function makeScene(width, height) {
    const cx = width * .5, cy = height * .5;
    const small = Math.min(width, height);
    const random = makeRandom(13721);
    const n = 34;
    const holeRadius = clamp(small * .165, 56, 170);
    const maxR = Math.hypot(width, height) * 1.18;
    // Hand-jagged inner perimeter: individual notches and small teeth, like a punched-out car window.
    const edgeCount = n * 4;
    const edge = Array.from({ length: edgeCount }, (_, i) => {
      const a = i / edgeCount * Math.PI * 2 - Math.PI / 2;
      const organic = 1 + .055 * Math.sin(a * 3.2 + .6) + .037 * Math.sin(a * 7.1 - .9);
      const chip = (random() - .5) * .08 + (i % 9 === 0 ? random() * .045 : 0);
      const noise = organic + chip;
      return { x: cx + Math.cos(a) * holeRadius * noise, y: cy + Math.sin(a) * holeRadius * noise };
    });
    const radii = [holeRadius, small * .42, small * .79, maxR];
    const rings = radii.map((r, layer) => Array.from({ length: n }, (_, i) => {
      const a = i * 2 * Math.PI / n - Math.PI / 2 + (layer === 3 ? 0 : (random() - .5) * .11);
      const radius = r * (layer === 3 ? 1 : .88 + random() * .22);
      return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
    }));
    const classic = [];
    function piece(points, center = false) {
      return {
        points, center,
        midpoint: points.reduce((sum, p) => ({x:sum.x+p.x/points.length,y:sum.y+p.y/points.length}),{x:0,y:0}),
        delay: random() * 245,
        drift: (random()-.5)*Math.min(width*.29,330),
        rotation: (random()-.5)*2.8,
        speed: .81 + random() * .42,
        tone: Math.floor(random()*4)
      };
    }
    for (let i=0; i<n; i++) {
      const next=(i+1)%n;
      classic.push(piece([{x:cx,y:cy},rings[0][i],rings[0][next]],true));
      for(let k=0;k<3;k++) {
        const a=rings[k][i], b=rings[k][next], c=rings[k+1][i], d=rings[k+1][next];
        const first = random()<.5 ? [[a,c,b],[c,d,b]] : [[a,c,d],[a,d,b]];
        for(const tri of first){
          const p=piece(tri);
          classic.push(p);
        }
      }
    }
    // Irregular crack network, varying branch angles and distances.
    const fractures = Array.from({length:n},(_,i)=>{
      const a=i/n*Math.PI*2-Math.PI/2;
      const s=edge[(i*4)%edgeCount];
      return [s,
        {x:cx+Math.cos(a+(random()-.5)*.22)*holeRadius*1.7,y:cy+Math.sin(a+(random()-.5)*.22)*holeRadius*1.7},
        {x:cx+Math.cos(a+(random()-.5)*.32)*holeRadius*2.6,y:cy+Math.sin(a+(random()-.5)*.32)*holeRadius*2.6},
        {x:cx+Math.cos(a+(random()-.5)*.24)*small*.77,y:cy+Math.sin(a+(random()-.5)*.24)*small*.77},
        {x:cx+Math.cos(a)*maxR,y:cy+Math.sin(a)*maxR}
      ];
    });
    return {width,height,cx,cy,small,holeRadius,maxR,random,classic,rings,edge,fractures};
  }

  function drawCracks(ctx,s,progress=1,opacity=1){
    if(progress<=0||opacity<=0)return;
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.globalAlpha=opacity;
    ctx.strokeStyle='rgba(175,228,255,.98)';ctx.lineWidth=1.7;
    ctx.shadowColor='rgba(104,208,255,.88)';ctx.shadowBlur=6;
    for(let i=0;i<s.fractures.length;i++){
      const p=s.fractures[i];
      if(i%3===1)continue;
      strokePartial(ctx,p,progress*(i%4===0?1:.87));
    }
    ctx.shadowBlur=0;ctx.strokeStyle='rgba(122,204,255,.78)';ctx.lineWidth=1.05;
    for(let i=0;i<s.fractures.length;i+=2){
      const a=s.fractures[i],b=s.fractures[(i+2)%s.fractures.length];
      strokePartial(ctx,[a[1],a[2],b[2],b[1]],clamp((progress-.15)/.85));
      if(i%4===0)strokePartial(ctx,[a[2],a[3],b[3]],clamp((progress-.3)/.7));
      if(i%3===0)strokePartial(ctx,[a[1],b[1]],clamp((progress-.2)/.8));
    }
    ctx.restore();
  }
  function drawShards(ctx, s, pieces, t, start, duration, centerStart){
    const fills=['rgba(128,180,205,.18)','rgba(108,160,188,.16)','rgba(148,198,220,.14)','rgba(95,145,170,.17)'];
    const edgeOpacity=pieces===s.classic?easeOut((t-280)/600):1;
    for(const p of pieces){
      const begin=(p.center?centerStart:start)+p.delay;
      const elapsed=Math.max(0,t-begin);
      const fall=clamp(elapsed/(p.center?710:duration)*p.speed);
      if(fall>=1)continue;
      ctx.save();
      if(fall>0){
        const drop=s.height*1.8*fall*fall;
        ctx.translate(p.midpoint.x,p.midpoint.y);
        ctx.rotate(p.rotation*fall);
        ctx.translate(-p.midpoint.x+p.drift*fall,-p.midpoint.y+drop);
      }
      poly(ctx,p.points);ctx.fillStyle=fills[p.tone];ctx.fill();
      ctx.strokeStyle='rgba(168,225,255,'+(.52*edgeOpacity*(1-fall*.25))+')';ctx.lineWidth=1.0;ctx.stroke();
      ctx.strokeStyle='rgba(245,252,255,'+(.22*edgeOpacity*(1-fall*.5))+')';ctx.lineWidth=.55;ctx.stroke();
      ctx.restore();
    }
  }
  function drawFlash(ctx,s,t,when=350,span=270){
    const flash=clamp(1-Math.abs(t-when)/span);
    if(flash===0)return;
    ctx.save();ctx.globalAlpha=flash*.85;
    const r=Math.max(45,s.holeRadius*1.35);
    const gradient=ctx.createRadialGradient(s.cx,s.cy,0,s.cx,s.cy,r);
    gradient.addColorStop(0,'rgba(255,255,255,.95)');gradient.addColorStop(.2,'rgba(212,238,255,.64)');gradient.addColorStop(1,'rgba(212,238,255,0)');
    ctx.fillStyle=gradient;ctx.fillRect(s.cx-r,s.cy-r,r*2,r*2);
    ctx.restore();
  }
  function classic(ctx,s,t){
    // Central impact, spiderweb cracks, then glass shards fall away.
    const crack=easeOut((t-280)/580);
    const fall=clamp((t-1320)/1080);
    drawShards(ctx,s,s.classic,t,1310,1080,870);
    if(crack>0&&fall<.92)drawCracks(ctx,s,crack,(1-fall)*.85);
    drawFlash(ctx,s,t,350,260);
  }
  function play(){
    if(reducedMotion || saver){
      // Respect OS motion preference; don't cover the website with an animation.
      return;
    }
    const overlay=document.createElement('div');overlay.className='glass-intro';
    overlay.setAttribute('role','presentation');
    const canvas=document.createElement('canvas');canvas.className='glass-intro-canvas';canvas.setAttribute('aria-hidden','true');
    const skip=document.createElement('button');skip.type='button';skip.className='glass-intro-skip';skip.textContent='Skip animation';
    overlay.append(canvas,skip);document.body.appendChild(overlay);
    const width=window.innerWidth, height=window.innerHeight;
    const dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    canvas.style.width=width+'px';canvas.style.height=height+'px';
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx){overlay.remove();return;}
    ctx.scale(dpr,dpr);
    const scene=makeScene(width,height);
    let raf=0, start=null, cancelled=false;
    function cancel(){
      if(cancelled)return;
      cancelled=true;cancelAnimationFrame(raf);
      window.removeEventListener('resize',cancel);
      window.removeEventListener('pagehide',cancel);
      document.removeEventListener('visibilitychange',onHide);
      document.removeEventListener('keydown',onKey);
      skip.removeEventListener('click',cancel);
      overlay.remove();
    }
    function onHide(){if(document.hidden)cancel();}
    function onKey(event){if(event.key==='Escape')cancel();}
    function frame(now){
      if(cancelled)return;
      if(start===null)start=now;
      const t=(now-start)*SPEED;
      ctx.clearRect(0,0,width,height);
      classic(ctx,scene,t);
      const duration=2730;
      if(t>=duration){cancel();return;}
      raf=requestAnimationFrame(frame);
    }
    skip.addEventListener('click',cancel);
    window.addEventListener('resize',cancel,{passive:true});
    window.addEventListener('pagehide',cancel,{once:true});
    document.addEventListener('visibilitychange',onHide);
    document.addEventListener('keydown',onKey);
    raf=requestAnimationFrame(frame);
  }

  let played=false;
  try { played=Boolean(sessionStorage.getItem(storeKey));sessionStorage.setItem(storeKey,'played'); }
  catch (_) { /* Storage disabled; intro remains optional. */ }
  if(!played||forcedPreview)play();
})();

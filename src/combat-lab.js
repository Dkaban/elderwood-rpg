// Elderwood Combat Lab — stand-alone browser sandbox.
// This deliberately does not depend on the older exploration engine.
import { CONFIG, SPRITE_SHEET, frameAt, attackFrame, facingVector, hitsDummy, attackPhase } from './combat-data.js?v=combat-lab-3';

const $ = id => document.getElementById(id);
const canvas = $('arena');
const ctx = canvas.getContext('2d', {alpha:false});
const sprites = new Image();
sprites.src = SPRITE_SHEET.src;
let artReady = false;
sprites.onload = () => {artReady=true; $('assetStatus').textContent='Illustrated attacks loaded · 4 directions';};
sprites.onerror = () => {artReady=false; $('assetStatus').textContent='Sprite sheet failed to load';};

const dirs=['south','east','north','west'];
const colors={grass:'#71965d',shadow:'#365541',gold:'#eac78b',ink:'#29362a'};
const state={
  player:{x:0,y:0,facing:'east',mode:'idle',elapsed:0,walkElapsed:0,attackId:0,hitDone:false,queued:false,target:null},
  dummy:{x:115,y:-14,radius:28,hp:100,max:100,flash:0,stagger:0,reset:0,hitCount:0},
  debug:{open:false,hurtbox:false,hitbox:true,collision:false,facing:false,stats:true},
  config:{...CONFIG}, numbers:[], particles:[], keys:new Set(), last:0, now:0, hitStop:0,
  view:{w:0,h:0,dpr:1,scale:1,cameraX:0,cameraY:0}, joystick:{id:null,x:0,y:0},
  lastSwingDamage:0, attackBuffered:false, sound:false, audio:null
};
const {player,dummy,view} = state;
const tween=(a,b,t)=>a+(b-a)*t, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function length(x,y){return Math.hypot(x,y);}
function formatMs(n){return Math.round(n)+'ms';}
function resize(){
  const rect=canvas.getBoundingClientRect();
  view.w=Math.max(1,rect.width);view.h=Math.max(1,rect.height);
  view.dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(view.w*view.dpr);
  canvas.height=Math.round(view.h*view.dpr);
  // Maintain legible, human-sized sprites in portrait, not tiny zoomed-out characters.
  view.scale= view.w<600 ? 1.06 : 1.22;
  ctx.setTransform(view.dpr,0,0,view.dpr,0,0);
}
function worldToScreen(x,y){
  return {x:view.w*.50+(x-view.cameraX)*view.scale,
          y:view.h*.54+(y-view.cameraY)*view.scale};
}
function screenToWorld(x,y){
  return {x:(x-view.w*.5)/view.scale+view.cameraX,
          y:(y-view.h*.54)/view.scale+view.cameraY};
}
function ground(){
  // Stable meadow. Rendered from deterministic integer positions; never random per frame.
  ctx.fillStyle='#6b8a54';ctx.fillRect(0,0,view.w,view.h);
  const camera=worldToScreen(0,0);
  const step=84*view.scale;
  const x0=((camera.x%step)+step)%step-step;
  const y0=((camera.y%step)+step)%step-step;
  for(let y=y0,yi=0;y<view.h+step;y+=step,yi++)
   for(let x=x0,xi=0;x<view.w+step;x+=step,xi++){
    const cellX=Math.floor((x-camera.x)/step),cellY=Math.floor((y-camera.y)/step);
    const seed=cellX*23+cellY*47;
    ctx.fillStyle=((seed*7)%5<2)?'rgba(232,221,140,.045)':'rgba(21,68,41,.055)';
    ctx.beginPath();ctx.ellipse(x+28*view.scale,y+35*view.scale,34*view.scale,25*view.scale,0,0,Math.PI*2);ctx.fill();
   }
  // Gentle perimeter, deliberately sparse—nothing competes with sword silhouettes.
  for(let i=0;i<56;i++){
    const xx=Math.sin(i*23.71)*450, yy=Math.cos(i*19.37)*310;
    if(Math.abs(xx)<205 && Math.abs(yy)<165)continue;
    const pt=worldToScreen(xx,yy);
    if(pt.x<0||pt.y<0||pt.x>view.w||pt.y>view.h)continue;
    ctx.strokeStyle=i%5?'#476f47':'#c9c17d';
    ctx.lineWidth=1.2*view.scale;ctx.beginPath();
    ctx.moveTo(pt.x,pt.y);ctx.lineTo(pt.x-2*view.scale,pt.y-7*view.scale);
    ctx.moveTo(pt.x,pt.y);ctx.lineTo(pt.x+3*view.scale,pt.y-5*view.scale);ctx.stroke();
    if(i%7===0){ctx.fillStyle=i%2?'#d7c2bd':'#f4e6bd';ctx.beginPath();ctx.arc(pt.x,pt.y-7*view.scale,2.6*view.scale,0,Math.PI*2);ctx.fill();}
  }
  const center=worldToScreen(70,0);
  const light=ctx.createRadialGradient(center.x,center.y-80*view.scale,6,center.x,center.y,290*view.scale);
  light.addColorStop(0,'rgba(246,230,167,.19)');light.addColorStop(1,'rgba(248,235,179,0)');
  ctx.fillStyle=light;ctx.fillRect(0,0,view.w,view.h);
  // Arena boundary is only a subtle ground line unless debug is enabled.
  const a=worldToScreen(-420,-300),b=worldToScreen(420,300);
  if(state.debug.collision){
    ctx.strokeStyle='rgba(237,217,119,.7)';ctx.lineWidth=2;ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
  }
}
function drawDummy(){
  const p=worldToScreen(dummy.x,dummy.y);
  const sc=view.scale, shake=Math.sin(dummy.stagger*76)*dummy.stagger*14;
  ctx.save();ctx.translate(p.x+shake,p.y);ctx.scale(sc,sc);
  ctx.fillStyle='rgba(27,52,36,.22)';ctx.beginPath();ctx.ellipse(0,0,29,8,0,0,Math.PI*2);ctx.fill();
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle='#59412c';ctx.lineWidth=10;
  ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(0,-95);ctx.moveTo(-33,-77);ctx.lineTo(33,-77);ctx.stroke();
  ctx.strokeStyle='#ac8053';ctx.lineWidth=6;
  ctx.beginPath();ctx.moveTo(-31,-80);ctx.lineTo(31,-80);ctx.stroke();
  ctx.fillStyle=dummy.flash>0?'#f0d9a2':'#c4a376';ctx.strokeStyle='#7d694c';ctx.lineWidth=2.4;
  ctx.beginPath();ctx.moveTo(-19,-101);ctx.lineTo(18,-103);ctx.lineTo(23,-49);ctx.lineTo(11,-35);ctx.lineTo(-13,-37);ctx.lineTo(-23,-51);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#a46b50';ctx.beginPath();ctx.arc(0,-70,17,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d5b68b';ctx.beginPath();ctx.arc(0,-70,11,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#a66a50';ctx.beginPath();ctx.arc(0,-70,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cab486';ctx.beginPath();ctx.roundRect(-15,-117,30,19,6);ctx.fill();
  ctx.strokeStyle='#7d6846';ctx.stroke();
  ctx.restore();
  const width=92*sc;
  ctx.fillStyle='rgba(23,39,30,.72)';ctx.fillRect(p.x-width/2,p.y-155*sc,width,5*sc);
  ctx.fillStyle='#d9a65a';ctx.fillRect(p.x-width/2,p.y-155*sc,width*(dummy.hp/dummy.max),5*sc);
  ctx.textAlign='center';ctx.font='600 11px system-ui';ctx.fillStyle='#f9e9c9';
  ctx.fillText('TRAINING DUMMY',p.x,p.y-163*sc);
}
function playerFrame(){
  if(player.mode==='attack'){
    const index=attackFrame(player.elapsed,state.config);
    return {...frameAt(player.facing,'attack',index),index};
  }
  // No fabricated walking frames: the supplied sheet contains attack poses.
  // Hold the clean guard pose while moving, rather than cycling swing frames.
  return {...frameAt(player.facing,'idle',0),index:0};
}
function drawPlayer(){
  const p=worldToScreen(player.x,player.y),sc=view.scale;
  const f=playerFrame();
  if(artReady){
    // Frame cell has transparent margins. Anchor the character's feet to world space.
    const w=f.width*sc,h=f.height*sc,x=p.x-w/2,y=p.y-h*.86;
    ctx.save();
    if(f.flipX){
      ctx.translate(p.x*2,0);
      ctx.scale(-1,1);
    }
    ctx.drawImage(sprites,f.x,f.y,f.width,f.height,x,y,w,h);
    ctx.restore();
  }else{
    ctx.fillStyle='#efe0bd';ctx.strokeStyle='#7c4a38';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(p.x,p.y-74*sc,15*sc,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#794837';ctx.fillRect(p.x-18*sc,p.y-52*sc,36*sc,46*sc);
  }
}
function debugWorld(){
  const p=worldToScreen(player.x,player.y),d=worldToScreen(dummy.x,dummy.y),sc=view.scale;
  if(state.debug.hurtbox||state.debug.collision){
    ctx.strokeStyle='#62e1bf';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-12*sc,state.config.playerRadius*sc,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#ee9878';ctx.beginPath();ctx.arc(d.x,d.y-12*sc,dummy.radius*sc,0,Math.PI*2);ctx.stroke();
  }
  const attacking=player.mode==='attack'&&attackPhase(player.elapsed,state.config)==='active';
  if(state.debug.hitbox && player.mode==='attack'){
    const vector=facingVector(player.facing),angle=Math.atan2(vector.y,vector.x);
    const half=state.config.arc*Math.PI/180/2;
    ctx.beginPath();ctx.moveTo(p.x,p.y-28*sc);
    ctx.arc(p.x,p.y-28*sc,state.config.reach*sc,angle-half,angle+half);
    ctx.closePath();
    ctx.fillStyle=attacking?'rgba(245,204,92,.24)':'rgba(237,196,111,.04)';ctx.fill();
    ctx.strokeStyle=attacking?'#fbe19e':'rgba(251,225,158,.35)';ctx.lineWidth=2;ctx.stroke();
  }
  if(state.debug.facing){
    const v=facingVector(player.facing);ctx.lineWidth=3;ctx.strokeStyle='#ffffff';ctx.beginPath();ctx.moveTo(p.x,p.y-45*sc);ctx.lineTo(p.x+v.x*52*sc,p.y-45*sc+v.y*52*sc);ctx.stroke();
  }
}
function floatingText(dt){
  for(let i=state.numbers.length-1;i>=0;i--){
    const n=state.numbers[i];n.life-=dt;n.y-=dt*62;
    const p=worldToScreen(n.x,n.y);
    ctx.save();ctx.globalAlpha=clamp(n.life/.65,0,1);ctx.textAlign='center';ctx.font='bold 24px system-ui';
    ctx.lineWidth=4;ctx.strokeStyle='#563b30';ctx.strokeText(String(n.value),p.x,p.y-120*view.scale);
    ctx.fillStyle='#ffe6a6';ctx.fillText(String(n.value),p.x,p.y-120*view.scale);ctx.restore();
    if(n.life<=0)state.numbers.splice(i,1);
  }
}
function pulseSound(){
  if(!state.sound)return;
  try {
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!state.audio)state.audio=new AudioCtx();
    const ac=state.audio,o=ac.createOscillator(),gain=ac.createGain();
    o.type='triangle';o.frequency.setValueAtTime(185,ac.currentTime);o.frequency.exponentialRampToValueAtTime(93,ac.currentTime+.07);
    gain.gain.setValueAtTime(.08,ac.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.095);
    o.connect(gain);gain.connect(ac.destination);o.start();o.stop(ac.currentTime+.1);
  }catch{/* Sound is optional. */}
}
function strikeCheck(){
  if(player.hitDone)return;
  player.hitDone=true;
  if(!hitsDummy(player,dummy,state.config))return;
  const damage=8+((player.attackId*7)%8);
  state.lastSwingDamage=damage;
  dummy.hp=Math.max(0,dummy.hp-damage);dummy.hitCount++;dummy.flash=.13;dummy.stagger=.19;
  state.hitStop=state.config.hitstop/1000;
  state.numbers.push({x:dummy.x,y:dummy.y-15,life:.8,value:damage});
  $('dummyHP').textContent=dummy.hp+' / '+dummy.max;
  $('hits').textContent=String(dummy.hitCount);
  $('damage').textContent=String(damage);
  pulseSound();
  if(dummy.hp<=0){dummy.reset=2.2;$('dummyState').textContent='Broken — resetting';}
}
function attack(){
  if(player.mode==='attack'){
    const total=state.config.windup+state.config.active+state.config.recovery;
    if(player.elapsed>total-160)player.queued=true;
    return;
  }
  player.mode='attack';player.elapsed=0;player.hitDone=false;player.queued=false;
  player.attackId++;player.target=null;
}
function movement(dt){
  let vx=0,vy=0;
  if(state.keys.has('a')||state.keys.has('arrowleft'))vx--;
  if(state.keys.has('d')||state.keys.has('arrowright'))vx++;
  if(state.keys.has('w')||state.keys.has('arrowup'))vy--;
  if(state.keys.has('s')||state.keys.has('arrowdown'))vy++;
  vx+=state.joystick.x;vy+=state.joystick.y;
  const mag=length(vx,vy);
  if(mag<.10 && player.target && player.mode!=='attack'){
    const dx=player.target.x-player.x,dy=player.target.y-player.y;
    const distance=length(dx,dy);
    if(distance>7){vx=dx/distance;vy=dy/distance;}
    else player.target=null;
  }
  let walking=length(vx,vy)>.1;
  if(walking && player.mode!=='attack'){
    const n=length(vx,vy);vx/=n;vy/=n;
    if(Math.abs(vx)>Math.abs(vy))player.facing=vx>0?'east':'west';
    else player.facing=vy>0?'south':'north';
    const speed=state.keys.has('shift')?state.config.speed*1.35:state.config.speed;
    const nx=clamp(player.x+vx*speed*dt,-420,420),ny=clamp(player.y+vy*speed*dt,-300,300);
    // Training dummy has a physical collision circle, with normal slide behavior.
    const stop=dummy.radius+state.config.playerRadius+4;
    if(length(nx-dummy.x,ny-dummy.y)>stop){player.x=nx;player.y=ny;}
    else if(length(nx-dummy.x,player.y-dummy.y)>stop)player.x=nx;
    else if(length(player.x-dummy.x,ny-dummy.y)>stop)player.y=ny;
    player.walkElapsed+=dt*1000;
    player.mode='walk';
  }else if(player.mode==='walk')player.mode='idle';
}
function update(dt){
  state.now+=dt*1000;
  if(state.hitStop>0){state.hitStop=Math.max(0,state.hitStop-dt);return;}
  movement(dt);
  if(player.mode==='attack'){
    const was=player.elapsed;player.elapsed+=dt*1000;
    const onset=state.config.windup;
    if(!player.hitDone && was<onset && player.elapsed>=onset)strikeCheck();
    const total=state.config.windup+state.config.active+state.config.recovery;
    if(player.elapsed>=total){
      const queued=player.queued;player.mode='idle';player.elapsed=0;player.queued=false;
      if(queued)attack();
    }
  }
  dummy.flash=Math.max(0,dummy.flash-dt);
  dummy.stagger=Math.max(0,dummy.stagger-dt);
  if(dummy.reset>0){
    dummy.reset-=dt;
    if(dummy.reset<=0){dummy.hp=dummy.max;dummy.flash=0;$('dummyHP').textContent='100 / 100';$('dummyState').textContent='Ready';}
  }
  view.cameraX=tween(view.cameraX,player.x,Math.min(1,dt*5));
  view.cameraY=tween(view.cameraY,player.y,Math.min(1,dt*5));
}
function draw(now){
  const dt=state.last?Math.min(.045,(now-state.last)/1000):0;
  state.last=now;
  update(dt);
  ctx.setTransform(view.dpr,0,0,view.dpr,0,0);ctx.imageSmoothingEnabled=true;
  ground();drawDummy();drawPlayer();debugWorld();floatingText(dt);
  if(!window.__elderwoodRunning){window.__elderwoodRunning=true;document.getElementById('runtimeWarning')?.setAttribute('hidden','');}
  if(state.debug.stats){
    const f=playerFrame(),mode=player.mode==='attack'?attackPhase(player.elapsed,state.config):player.mode;
    $('stateReadout').textContent=mode;
    $('frameReadout').textContent=(f.index+1)+' / '+(player.mode==='attack'?8:1);
    $('facingReadout').textContent=player.facing;
    $('phaseReadout').textContent=player.mode==='attack'?Math.round(player.elapsed)+'ms':'—';
  }
  requestAnimationFrame(draw);
}
function showDebug(open){
  state.debug.open=open;$('debugPanel').classList.toggle('open',open);$('debugToggle').setAttribute('aria-expanded',String(open));
}
function reset(){
  player.x=0;player.y=0;player.facing='east';player.mode='idle';player.target=null;player.elapsed=0;
  dummy.hp=100;dummy.hitCount=0;dummy.flash=0;dummy.stagger=0;dummy.reset=0;
  state.numbers=[];state.hitStop=0;state.lastSwingDamage=0;
  $('dummyHP').textContent='100 / 100';$('hits').textContent='0';$('damage').textContent='—';$('dummyState').textContent='Ready';
}
function initControls(){
  resize();window.addEventListener('resize',resize);
  window.addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','F3'].includes(e.key))e.preventDefault();
    const key=e.key.toLowerCase();
    if(e.repeat && (key===' '||key==='f'||key==='j'||key==='f3'))return;
    state.keys.add(key);
    if(key===' '||key==='f'||key==='j')attack();
    if(key==='f3')showDebug(!state.debug.open);
  });
  window.addEventListener('keyup',e=>state.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>{state.keys.clear();state.joystick.x=state.joystick.y=0;});
  $('attackButton').addEventListener('pointerdown',e=>{e.preventDefault();attack();});
  $('debugToggle').addEventListener('click',()=>showDebug(!state.debug.open));
  $('closeDebug').addEventListener('click',()=>showDebug(false));
  $('resetButton').addEventListener('click',reset);
  $('soundToggle').addEventListener('change',e=>{state.sound=e.target.checked;});
  for(const [id,key] of [['showHurtbox','hurtbox'],['showHitbox','hitbox'],['showCollision','collision'],['showFacing','facing'],['showStats','stats']]){
    const input=$(id);input.checked=state.debug[key];input.addEventListener('change',()=>{state.debug[key]=input.checked;});
  }
  for(const [id,key,label] of [['windup','windup','windupValue'],['active','active','activeValue'],['recovery','recovery','recoveryValue'],['reach','reach','reachValue'],['arc','arc','arcValue'],['hitstop','hitstop','hitstopValue']]){
    const input=$(id);input.value=state.config[key];
    $(label).textContent=key==='arc'?state.config[key]+'°':key==='reach'?state.config[key]+'px':formatMs(state.config[key]);
    input.addEventListener('input',()=>{state.config[key]=Number(input.value);
      $(label).textContent=key==='arc'?input.value+'°':key==='reach'?input.value+'px':formatMs(input.value);
    });
  }
  const stick=$('stick'),knob=$('stickKnob');
  function joy(e){
    const r=stick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    const limit=42,mag=length(dx,dy),ratio=Math.min(1,limit/(mag||1));
    state.joystick.x=clamp(dx/limit,-1,1);state.joystick.y=clamp(dy/limit,-1,1);
    knob.style.transform='translate('+(dx*ratio)+'px,'+(dy*ratio)+'px)';
  }
  stick.addEventListener('pointerdown',e=>{state.joystick.id=e.pointerId;stick.setPointerCapture(e.pointerId);joy(e);});
  stick.addEventListener('pointermove',e=>{if(e.pointerId===state.joystick.id)joy(e);});
  function stop(e){if(e.pointerId===state.joystick.id){state.joystick.id=null;state.joystick.x=state.joystick.y=0;knob.style.transform='translate(0,0)';}}
  stick.addEventListener('pointerup',stop);stick.addEventListener('pointercancel',stop);
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch')return;
    const rect=canvas.getBoundingClientRect();player.target=screenToWorld(e.clientX-rect.left,e.clientY-rect.top);
  });
  requestAnimationFrame(draw);
}
initControls();

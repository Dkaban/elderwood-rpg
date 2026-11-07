import {sprites} from './sprites.js';
import {createWorld, project, unproject, MAP_SIZE, TILE_W, TILE_H, START} from './world.js';
import {createWildlife, updateWildlife} from './wildlife.js';
import {FACING, ATTACK_REACH, ATTACK_HALF_ANGLE, isInAttackArc} from './combat.js';

const el=id=>document.getElementById(id);
const canvas=el('world'), ctx=canvas.getContext('2d',{alpha:false});
const dollCanvas=el('paperDoll'), dollCtx=dollCanvas.getContext('2d');
const world=createWorld();
const animals=createWildlife(world);
const ITEM_DEFS={
  'oak-staff':      {name:'Oak Staff',          slot:'mainHand',type:'weapon',icon:'⚚',detail:'A sturdy walking staff · 2–5 damage',armor:0},
  'iron-sword':     {name:'Iron Shortsword',    slot:'mainHand',type:'weapon',icon:'⚔',detail:'One-handed blade · 3–7 damage',armor:0},
  'round-shield':   {name:'Round Shield',       slot:'offHand', type:'armor', icon:'⬡',detail:'Wood and iron · +2 armor',armor:2},
  'leather-vest':   {name:'Worn Leather Vest',  slot:'chest',   type:'armor', icon:'▣',detail:'Simple protection · +3 armor',armor:3},
  'iron-hauberk':   {name:'Iron Hauberk',       slot:'chest',   type:'armor', icon:'♜',detail:'Linked iron rings · +7 armor',armor:7},
  'wool-hood':      {name:'Woolen Hood',        slot:'head',    type:'armor', icon:'♧',detail:'Warm forest clothing · +1 armor',armor:1},
  'iron-helm':      {name:'Iron Helm',          slot:'head',    type:'armor', icon:'♜',detail:'A weathered helm · +4 armor',armor:4},
  'forest-cloak':   {name:'Forest Cloak',       slot:'cloak',   type:'armor', icon:'◢',detail:'Moss-green travel cloak · +1 armor',armor:1},
  'travel-trousers':{name:'Traveler’s Trousers',slot:'legs',    type:'armor', icon:'♧',detail:'Well-worn cloth · +1 armor',armor:1},
  'travel-boots':   {name:'Leather Boots',      slot:'feet',    type:'armor', icon:'♢',detail:'Made for the road · +1 armor',armor:1}
};
const SLOT_DEF={
  head:{name:'Head',icon:'♧'},chest:{name:'Chest',icon:'▣'},
  cloak:{name:'Cloak',icon:'◢'},mainHand:{name:'Weapon',icon:'⚔'},
  offHand:{name:'Off hand',icon:'⬡'},legs:{name:'Legs',icon:'♙'},feet:{name:'Feet',icon:'♢'}
};
const SAVE_KEY='elderwood-v1';
const defaultSave={
  bag:['iron-sword','round-shield','wool-hood','forest-cloak'],
  equipment:{head:null,chest:'leather-vest',cloak:null,mainHand:'oak-staff',offHand:null,legs:'travel-trousers',feet:'travel-boots'},
  chestLooted:false, chestRemaining:['iron-hauberk','iron-helm'], player:{x:START.x,y:START.y}
};
function loadSave(){
  try{
    const raw=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!raw||!Array.isArray(raw.bag)||!raw.equipment)return structuredClone(defaultSave);
    const bag=raw.bag.filter(id=>ITEM_DEFS[id]);
    const equipment=Object.fromEntries(Object.keys(SLOT_DEF).map(slot=>[slot,ITEM_DEFS[raw.equipment[slot]]?.slot===slot?raw.equipment[slot]:null]));
    const x=Number(raw.player?.x),y=Number(raw.player?.y);
    const player=(Number.isFinite(x)&&Number.isFinite(y)&&!world.collides(x,y))?{x,y}:{...START};
    const chestRemaining=Array.isArray(raw.chestRemaining)?raw.chestRemaining.filter(id=>id==='iron-hauberk'||id==='iron-helm'):(raw.chestLooted?[]:['iron-hauberk','iron-helm']);
    return {bag,equipment,player,chestRemaining,chestLooted:chestRemaining.length===0};
  }catch{return structuredClone(defaultSave);}
}
const save=loadSave();
const player={...save.player,direction:'south',attackDirection:'south',moving:false,step:0,swingStart:0,swingUntil:0,swingHit:false,stamina:100,target:null,path:[]};
const dummy={hp:100,maxHp:100,hits:0,flashUntil:0,resetAt:0};
let damageNumbers=[];
const debug={collisions:false,attacks:false};
let viewport={w:0,h:0,dpr:1}, camera={x:player.x,y:player.y};
let lastTime=performance.now(), frame=0, lastSaveTime=0;
let inventoryFilter='all',toastTimer=null, panelOrder=20;
const keys=new Set();
const mobile={x:0,y:0,pointer:null};

function persist(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({...save,player:{x:player.x,y:player.y}}));}catch{/* Storage might be blocked; play anyway. */}
}
function toast(message){
  const target=el('toast');target.textContent=message;target.classList.add('show');
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>target.classList.remove('show'),2800);
}
function visible(id){return !el(id).classList.contains('hidden');}
function panel(id,show){
  el(id).classList.toggle('hidden',!show);
  const actions={characterWindow:'btnCharacter',inventoryWindow:'btnInventory'};
  if(actions[id])el(actions[id]).classList.toggle('active',show);
  if(show){el(id).style.zIndex=++panelOrder;}
}
function toggle(id){panel(id,!visible(id));}
function itemMarkup(id,suffix=''){const item=ITEM_DEFS[id];return `<span class="item-icon">${item.icon}</span><span class="item-desc"><strong>${item.name}</strong><span>${item.detail}</span></span><span class="item-chevron">${suffix||'›'}</span>`;}
function renderInventory(){
  const root=el('inventoryItems');root.replaceChildren();
  el('inventoryCount').textContent=String(save.bag.length);
  const entries=save.bag.filter(id=>inventoryFilter==='all'||ITEM_DEFS[id].type===inventoryFilter);
  if(!entries.length){const msg=document.createElement('p');msg.className='empty-bag';msg.textContent=inventoryFilter==='all'?'Your pack is empty. Explore the clearing for supplies.':'No items of this kind in your pack.';root.append(msg);}
  for(const [n,id] of entries.entries()){
    const button=document.createElement('button');button.className='item-row';button.innerHTML=itemMarkup(id);button.title=`Equip ${ITEM_DEFS[id].name}`;
    button.draggable=true;button.addEventListener('click',()=>equip(id));
    button.addEventListener('dragstart',event=>{event.dataTransfer.setData('text/plain',id);event.dataTransfer.effectAllowed='move';});
    button.dataset.item=id;root.append(button);
  }
  document.querySelectorAll('.inventory-tabs button').forEach(button=>button.classList.toggle('selected',button.dataset.filter===inventoryFilter));
}
function renderEquipment(){
  const root=el('equipSlots');root.replaceChildren();
  for(const [slot,entry] of Object.entries(SLOT_DEF)){
    const id=save.equipment[slot],button=document.createElement('button');
    button.className='equip-slot'+(id?' filled':'');button.dataset.slot=slot;
    button.innerHTML=`<span class="slot-art">${id?ITEM_DEFS[id].icon:entry.icon}</span><span class="slot-label">${entry.name}</span>`;
    button.title=id?`${ITEM_DEFS[id].name} — click to unequip`:`Empty ${entry.name} slot — drag an item here`;
    button.addEventListener('click',()=>id&&unequip(slot));
    button.addEventListener('dragover',event=>{event.preventDefault();button.style.borderColor='#f3df9d';});
    button.addEventListener('dragleave',()=>button.style.removeProperty('border-color'));
    button.addEventListener('drop',event=>{
      event.preventDefault();button.style.removeProperty('border-color');
      const incoming=event.dataTransfer.getData('text/plain');
      if(ITEM_DEFS[incoming]?.slot===slot)equip(incoming);
      else toast('That equipment does not fit this slot.');
    });
    root.append(button);
  }
  el('armorValue').textContent=String(Object.values(save.equipment).reduce((sum,id)=>sum+(ITEM_DEFS[id]?.armor||0),0));
  dollCtx.clearRect(0,0,dollCanvas.width,dollCanvas.height);dollCtx.imageSmoothingEnabled=false;
  const img=sprites.character(save.equipment,'south');
  dollCtx.drawImage(img,18,4,184,252);
}
function sync(){renderInventory();renderEquipment();persist();}
function equip(id){
  const item=ITEM_DEFS[id];if(!item)return;
  const position=save.bag.indexOf(id);if(position<0)return;
  save.bag.splice(position,1);
  if(save.equipment[item.slot])save.bag.unshift(save.equipment[item.slot]);
  save.equipment[item.slot]=id;sync();toast(`${item.name} equipped`);
}
function unequip(slot){
  const id=save.equipment[slot];if(!id)return;
  save.bag.unshift(id);save.equipment[slot]=null;sync();toast(`${ITEM_DEFS[id].name} moved to backpack`);
}
function renderLoot(){
  const root=el('lootItems');root.replaceChildren();
  if(save.chestRemaining.length===0){const p=document.createElement('p');p.className='empty-bag';p.textContent='The cache is empty.';root.append(p);return;}
  for(const id of [...save.chestRemaining]){
    const button=document.createElement('button');button.className='item-row';button.innerHTML=itemMarkup(id,'+');
    button.addEventListener('click',()=>{save.bag.push(id);save.chestRemaining=save.chestRemaining.filter(item=>item!==id);if(save.chestRemaining.length===0){save.chestLooted=true;panel('lootWindow',false);}sync();renderLoot();toast(`${ITEM_DEFS[id].name} added to backpack`);});
    root.append(button);
  }
}
function openChest(){
  if(Math.hypot(player.x-28.5,player.y-27.3)>3.2){toast('Move a little closer to the supply chest.');return;}
  renderLoot();panel('lootWindow',true);
}
function attack(){
  const now=performance.now();if(player.swingUntil>now)return;
  player.swingStart=now;
  player.swingHit=false;
  player.attackDirection=player.direction; // Lock facing for the full swing.
  player.swingDuration=360;
  player.swingUntil=now+player.swingDuration;
  // The dummy takes damage once when the weapon reaches its forward arc.
}
function resolveAttack(t){
  if(!player.swingHit&&t>=player.swingStart+player.swingDuration*.33 && t<player.swingUntil){
    player.swingHit=true; // At most one hit per swing, regardless of frame rate.
    const origin=project(player.x,player.y),target=project(world.dummy.x,world.dummy.y);
    if(isInAttackArc(origin,target,player.attackDirection)){
      const weapon=save.equipment.mainHand;
      const low=weapon==='iron-sword'?3:weapon==='oak-staff'?2:1;
      const high=weapon==='iron-sword'?7:weapon==='oak-staff'?5:2;
      const damage=low+Math.floor(Math.random()*(high-low+1));
      dummy.hp=Math.max(0,dummy.hp-damage);
      dummy.hits++;
      dummy.flashUntil=t+180;
      if(dummy.hp===0)dummy.resetAt=t+1400;
      damageNumbers.push({x:world.dummy.x,y:world.dummy.y,value:damage,start:t,drift:(Math.random()-.5)*15});
    }
  }
  if(dummy.resetAt>0&&t>=dummy.resetAt){dummy.hp=dummy.maxHp;dummy.resetAt=0;}
  damageNumbers=damageNumbers.filter(p=>t-p.start<940);
}

function updateLocation(){
  const r=Math.hypot(player.x-29,player.y-29);el('locationText').textContent=r<5?'The Old Clearing':r<14?'Whispering Vale':'Deepwood Trail';
  const nearChest=Math.hypot(player.x-28.5,player.y-27.3)<3.2;
  el('interaction').hidden=!nearChest;
  el('interactionText').textContent=save.chestLooted?'Inspect empty cache':'Open supply chest';
}
function screenPoint(x,y){
  const center=project(camera.x,camera.y),pt=project(x,y);
  return {x:pt.x-center.x+viewport.w*.47,y:pt.y-center.y+viewport.h*.53};
}
function gamePoint(sx,sy){
  const center=project(camera.x,camera.y);
  return unproject(sx-viewport.w*.47+center.x,sy-viewport.h*.53+center.y);
}
function nearestWalkable(tx,ty){
  for(let radius=0;radius<6;radius++){
    for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
      if(Math.abs(dx)!==radius&&Math.abs(dy)!==radius)continue;
      const x=tx+dx,y=ty+dy;
      if(x>=0&&y>=0&&x<MAP_SIZE&&y<MAP_SIZE&&!world.collides(x+.5,y+.5))return {x,y};
    }
  }
  return null;
}
function pathfind(x,y){
  const start={x:Math.floor(player.x),y:Math.floor(player.y)},end=nearestWalkable(Math.floor(x),Math.floor(y));
  if(!end)return [];
  const key=(x,y)=>`${x},${y}`;
  const startKey=key(start.x,start.y),endKey=key(end.x,end.y);
  const nodes=new Map([[startKey,{x:start.x,y:start.y,g:0,f:0,from:null}]]),open=[startKey],closed=new Set();
  for(let it=0;open.length&&it<3500;it++){
    let min=0;for(let i=1;i<open.length;i++)if(nodes.get(open[i]).f<nodes.get(open[min]).f)min=i;
    const hereKey=open.splice(min,1)[0],here=nodes.get(hereKey);
    if(hereKey===endKey){
      const path=[];let current=hereKey;
      while(current&&current!==startKey){const node=nodes.get(current);path.unshift({x:node.x+.5,y:node.y+.5});current=node.from;}
      if(path.length&&Math.floor(x)===end.x&&Math.floor(y)===end.y&&!world.collides(x,y))path[path.length-1]={x,y};
      return path;
    }
    closed.add(hereKey);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;
      const nx=here.x+dx,ny=here.y+dy,nkey=key(nx,ny);
      if(closed.has(nkey)||world.collides(nx+.5,ny+.5))continue;
      // Prevent diagonal corner cutting through solid objects.
      if(dx&&dy&&(world.collides(here.x+dx+.5,here.y+.5)||world.collides(here.x+.5,here.y+dy+.5)))continue;
      const cost=here.g+(dx&&dy?1.414:1);
      if(!nodes.has(nkey)||cost<nodes.get(nkey).g){
        nodes.set(nkey,{x:nx,y:ny,g:cost,f:cost+Math.hypot(end.x-nx,end.y-ny),from:hereKey});
        if(!open.includes(nkey))open.push(nkey);
      }
    }
  }
  return [];
}
function walkTo(x,y){
  if(Math.hypot(x-player.x,y-player.y)<.15)return;
  player.path=pathfind(x,y);
  if(!player.path.length)toast('You cannot travel there.');
}
function move(dx,dy,step){
  const tryX=player.x+dx*step,tryY=player.y+dy*step;
  if(!world.collides(tryX,tryY,.2)){player.x=tryX;player.y=tryY;return true;}
  let moved=false;
  if(!world.collides(tryX,player.y,.2)){player.x=tryX;moved=true;}
  if(!world.collides(player.x,tryY,.2)){player.y=tryY;moved=true;}
  return moved;
}
function update(dt,t){
  frame++;
  updateWildlife(animals,world,player,dt);
  resolveAttack(t);
  let screenX=0,screenY=0;
  if(keys.has('a')||keys.has('arrowleft'))screenX--;
  if(keys.has('d')||keys.has('arrowright'))screenX++;
  if(keys.has('w')||keys.has('arrowup'))screenY--;
  if(keys.has('s')||keys.has('arrowdown'))screenY++;
  if(Math.hypot(mobile.x,mobile.y)>.14){screenX+=mobile.x;screenY+=mobile.y;}
  const manual=!!(screenX||screenY);let dx=0,dy=0;
  if(manual){
    player.path=[];
    const mag=Math.hypot(screenX,screenY);screenX/=mag;screenY/=mag;
    dx=(screenX+screenY)*Math.SQRT1_2;dy=(screenY-screenX)*Math.SQRT1_2;
  }else if(player.path.length){
    const target=player.path[0],dist=Math.hypot(target.x-player.x,target.y-player.y);
    if(dist<.13){player.path.shift();}
    else {dx=(target.x-player.x)/dist;dy=(target.y-player.y)/dist;screenX=(dx-dy)*Math.SQRT1_2;screenY=(dx+dy)*Math.SQRT1_2;}
  }
  const running=keys.has('shift')&&player.stamina>1&&manual;
  const speed=(running?4.7:2.9);
  let moving=false;
  if(dx||dy){
    const step=Math.min(dt*speed,0.12);
    if(player.path.length&&!manual){
      const target=player.path[0], dist=Math.hypot(target.x-player.x,target.y-player.y);
      moving=move(dx,dy,Math.min(dist,step));
    }else moving=move(dx,dy,step);
    if(Math.abs(screenX)>Math.abs(screenY))player.direction=screenX>0?'east':'west';
    else player.direction=screenY>0?'south':'north';
  }
  player.moving=moving;
  if(moving)player.step+=dt*(running?10:6);
  player.stamina=Math.min(100,Math.max(0,player.stamina+dt*(running?-22:14)));
  el('staminaFill').style.width=`${player.stamina.toFixed(0)}%`;
  el('staminaText').textContent=`${Math.round(player.stamina)} / 100`;
  camera.x+=(player.x-camera.x)*Math.min(1,dt*4.3);
  camera.y+=(player.y-camera.y)*Math.min(1,dt*4.3);
  if(frame%20===0)updateLocation();
  if(t-lastSaveTime>4000){lastSaveTime=t;persist();}
}
function drawGround(){
  ctx.fillStyle='#1b3a2d';ctx.fillRect(0,0,viewport.w,viewport.h);
  // Render only terrain tiles that touch the viewport.
  for(let y=0;y<MAP_SIZE;y++)for(let x=0;x<MAP_SIZE;x++){
    const tile=world.ground[y][x],at=screenPoint(x+.5,y+.5);
    if(at.x<-TILE_W||at.x>viewport.w+TILE_W||at.y<-TILE_H||at.y>viewport.h+TILE_H)continue;
    const sprite=sprites.get(tile.kind,tile.variant);
    ctx.drawImage(sprite,Math.round(at.x-TILE_W/2),Math.round(at.y-TILE_H/2));
  }
}
function drawActors(time){
  const drawList=[];
  for(const item of world.objects){
    const point=screenPoint(item.x,item.y);
    if(point.x<-180||point.x>viewport.w+180||point.y<-200||point.y>viewport.h+180)continue;
    drawList.push({kind:'obj',item,pt:point,depth:item.x+item.y});
  }
  for(const animal of animals){
    const pt=screenPoint(animal.x,animal.y);
    if(pt.x<-90||pt.x>viewport.w+90||pt.y<-95||pt.y>viewport.h+95)continue;
    drawList.push({kind:'animal',animal,pt,depth:animal.x+animal.y});
  }
  drawList.push({kind:'player',pt:screenPoint(player.x,player.y),depth:player.x+player.y+.01});
  drawList.sort((a,b)=>a.depth-b.depth);
  for(const entity of drawList){
    const {pt}=entity;
    if(entity.kind==='player'){
      ctx.fillStyle='rgba(7,18,14,.30)';ctx.beginPath();ctx.ellipse(pt.x,pt.y-3,20,8,0,0,Math.PI*2);ctx.fill();
      const now=performance.now();
      const swinging=now<player.swingUntil;
      const swingPhase=swinging?Math.min(1,(now-player.swingStart)/(player.swingUntil-player.swingStart||1)):false;
      const walking=player.moving&&Math.floor(player.step)%2===1;
      const sprite=sprites.character(save.equipment,swinging?player.attackDirection:player.direction,walking,swingPhase);
      ctx.drawImage(sprite,Math.round(pt.x-sprite.width/2),Math.round(pt.y-136));
      // Subtle name plate improves legibility when surrounded by trees.
      ctx.font='600 10px "DM Sans",Arial';ctx.textAlign='center';
      ctx.fillStyle='rgba(7,23,17,.8)';ctx.fillText('THE WANDERER',pt.x+1,pt.y-136);
      ctx.fillStyle='#e7e0c5';ctx.fillText('THE WANDERER',pt.x,pt.y-137);
    }else if(entity.kind==='animal'){
      const a=entity.animal;
      const sprite=sprites.wildlife(a.type,Math.floor(a.step)%2,a.facing);
      ctx.drawImage(sprite,Math.round(pt.x-sprite.width/2),Math.round(pt.y-sprite.height+5));
    }else{
      const item=entity.item;
      const variant=item.kind==='chest'?Number(save.chestLooted):item.kind==='fire'?Math.floor(time/350)%3:item.kind==='dummy'?Number(time<dummy.flashUntil):item.variant;
      const sprite=sprites.get(item.kind,variant);
      let anchor=sprite.height-7;
      if(item.kind==='tree'||item.kind==='pine')anchor=sprite.height-14;
      if(item.kind==='fire'){
        const glow=ctx.createRadialGradient(pt.x,pt.y-21,6,pt.x,pt.y-21,95);
        glow.addColorStop(0,'rgba(243,163,65,.18)');glow.addColorStop(1,'rgba(243,163,65,0)');
        ctx.fillStyle=glow;ctx.fillRect(pt.x-100,pt.y-112,200,200);
      }
      ctx.drawImage(sprite,Math.round(pt.x-sprite.width/2),Math.round(pt.y-anchor));
      if(item.kind==='dummy'){
        ctx.save();ctx.textAlign='center';ctx.font='600 10px "DM Sans",Arial';
        ctx.fillStyle='rgba(10,24,19,.87)';ctx.fillRect(pt.x-52,pt.y-132,104,32);
        ctx.fillStyle='#f3db9f';ctx.fillText('TRAINING DUMMY',pt.x,pt.y-119);
        ctx.fillStyle='#303b2f';ctx.fillRect(pt.x-40,pt.y-112,80,5);
        ctx.fillStyle='#b88753';ctx.fillRect(pt.x-40,pt.y-112,80*dummy.hp/dummy.maxHp,5);
        ctx.restore();
      }
    }
  }
}
function drawDamageNumbers(time){
  for(const damage of damageNumbers){
    const age=(time-damage.start)/940;
    const pt=screenPoint(damage.x,damage.y);
    ctx.save();ctx.globalAlpha=Math.max(0,1-age);
    ctx.textAlign='center';ctx.font='bold 25px "DM Sans",Arial';
    ctx.lineWidth=4;ctx.strokeStyle='#36231c';
    const x=pt.x+damage.drift*age,y=pt.y-148-age*49;
    ctx.strokeText(String(damage.value),x,y);ctx.fillStyle='#ffeab1';ctx.fillText(String(damage.value),x,y);
    ctx.restore();
  }
}
function debugFootprint(x,y,r,color){
  const pt=screenPoint(x,y);
  ctx.beginPath();ctx.ellipse(pt.x,pt.y-3,r*TILE_W*.72,r*TILE_H*.72,0,0,Math.PI*2);
  ctx.fillStyle=color.replace('1)', '.16)');ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=1.8;ctx.stroke();
}
function drawDebug(time){
  if(debug.attacks&&time<player.swingUntil){
    const direction=player.attackDirection,axis=FACING[direction];
    const center=Math.atan2(axis.y,axis.x);
    const pt=screenPoint(player.x,player.y);
    const ox=pt.x,oy=pt.y-48;
    ctx.beginPath();ctx.moveTo(ox,oy);
    ctx.arc(ox,oy,ATTACK_REACH,center-ATTACK_HALF_ANGLE,center+ATTACK_HALF_ANGLE);
    ctx.closePath();ctx.fillStyle='rgba(244,202,91,.20)';ctx.fill();
    ctx.strokeStyle='#ffce72';ctx.lineWidth=2;ctx.stroke();
  }
  if(!debug.collisions)return;
  // Red diamonds indicate impassable terrain cells, exactly as collides() tests them.
  for(const key of world.obstacles){
    const [x,y]=key.split(',').map(Number),pt=screenPoint(x+.5,y+.5);
    if(pt.x<-TILE_W||pt.x>viewport.w+TILE_W||pt.y<-TILE_H||pt.y>viewport.h+TILE_H)continue;
    ctx.beginPath();ctx.moveTo(pt.x,pt.y-TILE_H/2);
    ctx.lineTo(pt.x+TILE_W/2,pt.y);ctx.lineTo(pt.x,pt.y+TILE_H/2);
    ctx.lineTo(pt.x-TILE_W/2,pt.y);ctx.closePath();
    ctx.fillStyle='rgba(240,72,80,.13)';ctx.fill();
    ctx.strokeStyle='rgba(251,85,97,.55)';ctx.lineWidth=1;ctx.stroke();
  }
  debugFootprint(player.x,player.y,.2,'rgba(107,236,145,1)');
  debugFootprint(world.dummy.x,world.dummy.y,.43,'rgba(255,190,88,1)');
}
function drawFireflies(time){
  for(let i=0;i<35;i++){
    const x=10+(i*37)%36+rhash(i*3)*4,y=8+(i*23)%38+rhash(i*8)*4;
    const pos=screenPoint(x,y),p=(time/1600+i*4.21);
    if(pos.x<0||pos.x>viewport.w||pos.y<0||pos.y>viewport.h)continue;
    const alpha=.13+.28*Math.max(0,Math.sin(p));
    ctx.fillStyle=`rgba(241,216,121,${alpha})`;ctx.fillRect(pos.x+Math.cos(p)*6,pos.y-24+Math.sin(p)*5,2,2);
  }
}
function rhash(n){let s=Math.sin(n*97.72+22)*45636;return s-Math.floor(s);}
function render(t){
  const dt=Math.min((t-lastTime)/1000,.05);lastTime=t;
  update(dt,t);ctx.imageSmoothingEnabled=false;
  drawGround();drawActors(t);drawDebug(t);drawDamageNumbers(t);drawFireflies(t);
  requestAnimationFrame(render);
}
function resize(){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  viewport={w:rect.width,h:rect.height,dpr};
  canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;
}
function clickGround(event){
  const bounds=canvas.getBoundingClientRect();const point=gamePoint(event.clientX-bounds.left,event.clientY-bounds.top);
  if(Math.hypot(point.x-28.5,point.y-27.3)<1.3 && Math.hypot(player.x-28.5,player.y-27.3)<3.2){openChest();return;}
  walkTo(point.x,point.y);
}
function initializeUI(){
  for(const [button,id] of [['btnCharacter','characterWindow'],['btnInventory','inventoryWindow'],['btnHelp','helpWindow'],['hotbarCharacter','characterWindow'],['hotbarBag','inventoryWindow']]){
    el(button).addEventListener('click',()=>toggle(id));
  }
  el('hotbarAttack').addEventListener('click',attack);el('mobileAttack').addEventListener('click',attack);
  el('btnDebugMenu').addEventListener('click',()=>{panel('helpWindow',false);panel('debugWindow',true);});
  el('debugCollisions').addEventListener('change',event=>debug.collisions=event.target.checked);
  el('debugAttacks').addEventListener('change',event=>debug.attacks=event.target.checked);
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>panel(button.dataset.close,false)));
  document.querySelectorAll('.inventory-tabs button').forEach(button=>button.addEventListener('click',()=>{inventoryFilter=button.dataset.filter;renderInventory();}));
  window.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright',' ','shift','f3'].includes(key))event.preventDefault();
    if(event.repeat&&['i','p','e','f',' '].includes(key))return;
    keys.add(key);
    if(key==='i')toggle('inventoryWindow');
    else if(key==='p')toggle('characterWindow');
    else if(key==='?'||key==='h')toggle('helpWindow');
    else if(key==='e')openChest();
    else if(key==='f'||key===' ')attack();
    else if(key==='f3')toggle('debugWindow');
    else if(key==='escape')for(const id of ['lootWindow','helpWindow','debugWindow','inventoryWindow','characterWindow'])panel(id,false);
    else if(key==='1')attack();
    else if(key==='2')toggle('characterWindow');
    else if(key==='3')toggle('inventoryWindow');
  });
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur',()=>keys.clear());
  canvas.addEventListener('pointerup',event=>{if(event.button===0)clickGround(event);});
  el('interaction').addEventListener('click',openChest);
  // The classic floating windows can be moved aside by dragging their title bars.
  for(const id of ['characterWindow','inventoryWindow']){
    const win=el(id),heading=win.querySelector('.window-heading');
    heading.style.cursor='move';
    let drag=null;
    heading.addEventListener('pointerdown',event=>{
      if(event.target.closest('button')||window.matchMedia('(max-width:820px)').matches)return;
      const r=win.getBoundingClientRect();drag={x:event.clientX,y:event.clientY,left:r.left,top:r.top};
      heading.setPointerCapture(event.pointerId);win.style.zIndex=++panelOrder;
    });
    heading.addEventListener('pointermove',event=>{
      if(!drag)return;
      const left=Math.max(0,Math.min(window.innerWidth-win.offsetWidth,drag.left+event.clientX-drag.x));
      const top=Math.max(0,Math.min(window.innerHeight-55,drag.top+event.clientY-drag.y));
      win.style.right='auto';win.style.left=`${left}px`;win.style.top=`${top}px`;
    });
    heading.addEventListener('pointerup',()=>drag=null);
    heading.addEventListener('pointercancel',()=>drag=null);
  }
  const stick=el('mobileStick'),knob=el('mobileStickKnob');
  function stickMove(event){
    const bounds=stick.getBoundingClientRect(),centerX=bounds.left+bounds.width/2,centerY=bounds.top+bounds.height/2;
    const dx=event.clientX-centerX,dy=event.clientY-centerY,d=Math.hypot(dx,dy),max=32;
    mobile.x=Math.max(-1,Math.min(1,dx/max));mobile.y=Math.max(-1,Math.min(1,dy/max));
    const scale=d>max?max/d:1;
    knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;
  }
  stick.addEventListener('pointerdown',event=>{mobile.pointer=event.pointerId;stick.setPointerCapture(event.pointerId);stickMove(event);});
  stick.addEventListener('pointermove',event=>{if(event.pointerId===mobile.pointer)stickMove(event);});
  const stop=()=>{mobile.pointer=null;mobile.x=mobile.y=0;knob.style.transform='translate(0,0)';};
  stick.addEventListener('pointerup',stop);stick.addEventListener('pointercancel',stop);
  window.addEventListener('resize',resize);
  if(window.innerWidth<820){panel('characterWindow',false);panel('inventoryWindow',false);}
  sync();renderLoot();updateLocation();resize();
  requestAnimationFrame(render);
  setTimeout(()=>toast('Welcome to Elderwood. Your adventure begins in the Whispering Vale.'),1700);
}
initializeUI();

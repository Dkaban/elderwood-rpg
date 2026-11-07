// Every game object is rendered from a small, pre-rasterized pixel sprite.
// No external artwork, asset servers, or libraries are needed.

const palette = {
  ink: '#172724', skin: '#e8bc91', skinShade: '#bd8567', hair: '#4b3428',
  shirt: '#e0d1a7', pants: '#554b42', boots: '#534034', leather: '#784d32',
  leatherLight: '#aa7750', iron: '#aabac0', ironShadow: '#5c737b',
  gold: '#d9b569', cloak: '#2f5745', cloakLight: '#538168',
};

function canvas(w, h) {
  const element = document.createElement('canvas');
  element.width = w; element.height = h;
  const context = element.getContext('2d');
  context.imageSmoothingEnabled = false;
  return { element, context };
}
function rnd(x) { let n = Math.sin(x * 43.167 + 8.19) * 47498.97; return n - Math.floor(n); }
function rect(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function poly(c, coords, color) {
  c.fillStyle = color; c.beginPath(); c.moveTo(coords[0],coords[1]);
  for(let i=2;i<coords.length;i+=2) c.lineTo(coords[i], coords[i+1]);
  c.closePath(); c.fill();
}
function ellipse(c, x, y, rx, ry, fill) {
  c.fillStyle=fill; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fill();
}
function stamp(w,h,scale, painter) {
  const {element:tiny,context:c}=canvas(Math.ceil(w/scale),Math.ceil(h/scale));
  painter(c,tiny.width,tiny.height);
  const result=canvas(w,h); result.context.drawImage(tiny,0,0,w,h);
  return result.element;
}

function ground(kind, v=0) {
  return stamp(84,42,2,(c,w,h)=>{
    const grass=[['#476b49','#385a3f','#577d51'],['#4e7050','#3e6246','#608359'],['#456747','#35583e','#557751']][v%3];
    const path=[['#8d805d','#6f684e','#ad9870'],['#8b7958','#6e6049','#9f8c68'],['#958665','#736950','#afa17d']][v%3];
    const water=['#355e65','#264f5a','#477e79'];
    const colors=kind==='path'?path:kind==='water'?water:grass;
    poly(c,[0,10,21,0,42,10,21,20],colors[0]);
    poly(c,[0,10,21,20,42,10,42,12,21,22,0,12],colors[1]);
    for(let i=0;i<24;i++) {
      let x=2+Math.floor(rnd(i+v*90)*37),y=1+Math.floor(rnd(i*8+v*29)*18);
      if(Math.abs(x-21)/21 + Math.abs(y-10)/10 > .84) continue;
      if(kind==='water'){
        if(i%4===0) rect(c,x,y,3,1, i%8===0?'#659a8c':'#477b78');
      }else if(kind==='path') {
        rect(c,x,y,1+(i%2),1,i%3===0?colors[2]:colors[1]);
      }else{
        rect(c,x,y,1,1,i%3===0?colors[2]:'#65805a');
        if(i%7===0){rect(c,x,y-1,1,1,'#72926a');rect(c,x+1,y,1,1,'#638b5b');}
      }
    }
  });
}

function tree(v=0) {
  return stamp(192,190,2,(c)=>{
    const ox=16, trunkX=32+ox;
    ellipse(c,trunkX,86,25,6,'rgba(9,30,23,.25)');
    poly(c,[trunkX-5,85,trunkX-5,47,trunkX-8,40,trunkX-3,36,trunkX+2,55,trunkX+7,40,trunkX+11,43,trunkX+4,64,trunkX+4,85], '#493d31');
    rect(c,trunkX-2,49,3,33,'#6b5340'); rect(c,trunkX+1,58,1,23,'#9b7650');
    const clusters=[[-5,35,17,12],[9,29,19,15],[26,22,20,16],[42,37,19,14],[18,41,25,17],[36,51,16,14],[3,52,16,12]];
    const deep=['#1a493b','#1c503f','#234c38'][v%3];
    const mid=['#296446','#30714b','#376447'][v%3];
    const light=['#3d8053','#4d9160','#5f8551'][v%3];
    clusters.forEach(([x,y,rx,ry],i)=>{
      x-=18; // Keep the entire crown centered over the trunk, without clipped edges.
      ellipse(c,trunkX+x, y+7, rx,ry,deep);
      ellipse(c,trunkX-3+x, y+3, rx-2,ry-2,mid);
      ellipse(c,trunkX-5+x,y,Math.max(4,rx-6),Math.max(4,ry-6), light);
      for(let j=0;j<13;j++) {
        const px= Math.round(trunkX-4+x+(rnd(i*101+j*7+v*34)-.5)*rx*1.5);
        const py= Math.round(y+(rnd(i*55+j*13+v*39)-.5)*ry*1.5);
        rect(c,px,py,j%3===0?3:2,1,j%4===0?'#88a96d':j%2===0?light:mid);
      }
    });
    for(let i=0;i<25;i++) {
      const x=trunkX-23+rnd(i*7+v)*48,y=26+rnd(i*13+v)*39;
      rect(c,x,y,2,2,deep);
    }
  });
}
function pine() {
  return stamp(140,190,2,(c)=>{
    const ox=7, center=28+ox;
    ellipse(c,center,87,23,5,'rgba(9,30,23,.25)');
    rect(c,center-2,36,5,50,'#544131'); rect(c,center-1,44,2,39,'#856346');
    for(let j=0;j<4;j++){
      const y=10+j*14, wid=13+j*7;
      poly(c,[center, y-3, center-wid, y+27,center+wid,y+27],'#173e37');
      poly(c,[center, y-6, center-wid+4, y+20,center+wid-3,y+20],j%2===0?'#285c46':'#27543f');
      for(let i=0;i<11;i++){
        const x=center+(rnd(j*31+i*13)-.5)*wid*1.65;
        const py=y+6+rnd(j*78+i*9)*15;
        rect(c,x,py,2,1,i%3===0?'#5f8964':'#3c7552');
      }
    }
  });
}
function rock() {
  return stamp(66,46,2,(c)=>{
    ellipse(c,17,20,15,4,'rgba(10,31,27,.25)');
    poly(c,[2,16,7,7,20,4,29,12,30,19,25,23,6,22],'#4e6665');
    poly(c,[7,7,20,4,29,12,18,13,12,16,2,16],'#91a19a');
    poly(c,[18,13,29,12,30,19,25,23,12,21],'#647b7c');
    rect(c,8,10,4,1,'#bac7b5');rect(c,17,17,5,2,'#3e6157');
  });
}
function shrub(v=0) {
  return stamp(64,53,2,c=>{
    ellipse(c,15,23,14,4,'rgba(9,30,23,.20)');
    [[9,14,9,10],[19,13,11,12],[27,18,8,8]].forEach(([x,y,rx,ry],i)=>{
      ellipse(c,x,y+4,rx,ry,'#204a37');
      ellipse(c,x-2,y,rx-1,ry-2,v===0?'#4c8650':'#39744b');
      rect(c,x-6,y-3,4,2,'#6b9d67');
      if(i===1&&v===1) {rect(c,x+1,y-5,2,2,'#e8c980');rect(c,x-8,y+4,2,2,'#d4d0b0');}
    });
  });
}
function flower(v=0) {
  return stamp(48,36,2,c=>{
    const cols=v===0?['#ebc77a','#f2e4ac']:['#bcb2e4','#e1cadc'];
    for(let i=0;i<6;i++) {
      let x=3+rnd(i*8+v*12)*15,y=9+rnd(i*19+v*9)*6;
      rect(c,x,y,1,7,'#3c7743');rect(c,x-1,y-1,3,3,cols[i%2]);rect(c,x,y,1,1,'#b98b4c');
    }
  });
}
function logSprite() {
  return stamp(80,44,2,c=>{
    ellipse(c,21,18,18,4,'rgba(7,23,19,.23)');
    poly(c,[5,8,31,10,36,14,30,20,6,18], '#624632');
    poly(c,[5,8,31,10,36,14,8,12], '#8c6744');
    ellipse(c,7,13,5,5,'#b28a60');ellipse(c,7,13,3,3,'#71533c');
    rect(c,14,12,11,1,'#ac8257');
  });
}
function chest(open=false) {
  return stamp(74,72,2,c=>{
    ellipse(c,18,32,17,5,'rgba(7,23,19,.25)');
    poly(c,[4,18,22,10,34,17,16,25],'#6a3c26');
    poly(c,[4,18,16,25,16,34,4,28],'#653c29');
    poly(c,[16,25,34,17,34,29,16,34],'#8f5731');
    if(open){
      poly(c,[4,16,20,3,34,10,16,23],'#70462c');
      poly(c,[8,16,20,8,29,12,16,21],'#2b2a27');
      rect(c,9,18,8,2,'#d9b56a');
    }else{
      poly(c,[4,18,22,10,34,17,16,25],'#a46b38');
    }
    rect(c,8,19,2,12,'#c2a45e');rect(c,26,20,2,11,'#c2a45e');
    rect(c,16,22,3,6,'#e4c26d');rect(c,17,23,1,4,'#594531');
  });
}
function sign() {
  return stamp(74,112,2,c=>{
    ellipse(c,18,51,10,3,'rgba(7,23,19,.20)');
    rect(c,16,14,5,40,'#55402d');rect(c,18,15,2,39,'#8f714a');
    poly(c,[4,13,26,11,32,18,25,25,4,24],'#634d30');
    poly(c,[4,12,26,10,32,17,25,21,4,20],'#aa8755');
    rect(c,10,16,14,1,'#d9b77d');rect(c,26,16,3,2,'#e6bc6e');
    rect(c,7,14,2,2,'#584732');
  });
}
function campfire(frame=0) {
  return stamp(70,76,2,c=>{
    ellipse(c,17,33,15,5,'rgba(12,29,24,.25)');
    [3,12,22,31].forEach((x,i)=>{ellipse(c,x,32+(i%2),5,3,'#6b7068');});
    poly(c,[6,32,22,29,29,34,13,37],'#6a4832');
    poly(c,[7,35,22,27,29,30,12,39],'#8c5c35');
    poly(c,[12,32,15,21,19,26,24,15,25,32],'#cd5a2e');
    poly(c,[15,32,18,16+(frame%3)*2,20,24,23,22,23,32],'#f0ac44');
    poly(c,[17,31,19,23,20,31],'#fff3a2');
  });
}
function drawHeldWeapon(c, direction, weaponId, swingPhase=false) {
  if(!weaponId)return;
  const back=direction==='north', left=direction==='west', right=direction==='east';
  const phase = swingPhase===false ? null : Math.max(0, Math.min(1, swingPhase));
  if(weaponId==='oak-staff'){
    const x = back?43:left?9:44;
    if(phase===null){
      poly(c,[x,10,x+3,8,x+5,68,x+2,69],'#77583a');
      rect(c,x+1,12,2,45,'#bd9866');
      ellipse(c,x+2,9,3,4,'#5d855c');
      return;
    }
    const pivotX = x + (right?0:left?4:2);
    const pivotY = 44;
    const start = right? -1.15 : left? 1.15 : -0.95;
    const end   = right?  0.55 : left?-0.55 :  0.95;
    const angle = start + (end-start) * phase;
    c.save();
    c.translate(pivotX,pivotY);
    c.rotate(angle);
    rect(c,-1,-36,3,44,'#bd9866');
    poly(c,[-2,-39,1,-41,3,-36,0,-35],'#77583a');
    ellipse(c,0,-39,3,4,'#5d855c');
    c.restore();
    return;
  }
  const x = back?43:left?9:44;
  if(phase===null){
    rect(c,x+1,15,3,45,'#7e6751');
    poly(c,[x,31,x,8,x+2,2,x+5,8,x+5,31],palette.iron);
    rect(c,x+1,8,1,22,'#edf1e2');
    rect(c,x-6,31,17,4,'#c7a563');
    rect(c,x+1,36,3,15,'#785032');
    return;
  }
  const pivotX = x + 2;
  const pivotY = 33;
  const start = back ? 2.35 : right ? -1.35 : left ? 1.35 : -1.9;
  const end   = back ? 0.75 : right ?  0.35 : left ?-0.35 :  1.05;
  const angle = start + (end-start) * phase;
  c.save();
  c.translate(pivotX,pivotY);
  c.rotate(angle);
  poly(c,[-2,-2,-2,-25,0,-31,3,-25,3,-2],palette.iron);
  rect(c,-1,-24,1,18,'#edf1e2');
  rect(c,-8,-2,16,4,'#c7a563');
  rect(c,-1,2,3,15,'#785032');
  rect(c,-1,15,3,2,'#4f3729');
  c.restore();
}

function spriteCharacter(direction, equipment, step=false, swingPhase=false) {
  // Each combination is a real raster sprite; reuse until loadout or animation changes.
  return stamp(220,148,2,c=>{
    // Transparent margins leave room for the full sword swipe.
    c.save();c.translate(28,0);
    const E=equipment, back=direction==='north';
    ellipse(c,27,69,13,4,'rgba(7,22,19,.24)');
    const bob=step?1:0;
    c.save();c.translate(0,bob);
    const cape=!!E.cloak, shirt=!!E.chest, leg=!!E.legs, shoes=!!E.feet;
    const left=direction==='west',right=direction==='east';
    if(cape){
      poly(c,[19,24,35,24,40,57,35,63,18,61,14,53],palette.cloak);
      poly(c,[19,27,21,58,17,59,15,52],palette.cloakLight);
    }
    // Legs and boots
    rect(c,19,44,9,16,leg?palette.pants:'#867b67');rect(c,29,44,8,16,leg?palette.pants:'#867b67');
    rect(c,20,53,6,3,'#71685d');rect(c,30,53,5,3,'#71685d');
    rect(c,17,59,12,7,shoes?palette.boots:'#776c58');rect(c,28,59,12,7,shoes?palette.boots:'#776c58');
    rect(c,17,65,12,2,'#332e29');rect(c,28,65,12,2,'#332e29');
    // Torso and leather vest
    const metal=E.chest==='iron-hauberk';
    poly(c,[18,24,36,24,40,33,38,48,18,48,14,34],metal?palette.ironShadow:shirt?palette.leather:palette.shirt);
    rect(c,19,26,3,19,metal?'#cad0c0':shirt?palette.leatherLight:'#f4dcae');rect(c,34,26,3,19,metal?'#657b7d':shirt?'#5a382c':'#c7b68f');
    if(metal){for(let i=0;i<5;i++){rect(c,23,29+i*3,10,1,i%2?'#819395':'#bdc8c0');}}
    rect(c,18,44,20,4,'#473b31');rect(c,25,44,6,4,palette.gold);rect(c,27,45,2,2,'#574530');
    // Arms
    rect(c,12,29,7,18,metal?palette.ironShadow:shirt?palette.leather:'#e3c795');
    rect(c,38,29,7,18,metal?palette.ironShadow:shirt?palette.leather:'#e3c795');
    rect(c,12,42,7,6,palette.skin);rect(c,38,42,7,6,palette.skin);
    rect(c,13,32,4,8,shirt?palette.leatherLight:'#c4b58c');
    // Neck, face, hair
    rect(c,23,19,10,10,palette.skinShade);
    rect(c,20,10,17,17,back?palette.hair:palette.skin);
    rect(c,21,12,16,9,back?'#513b2b':palette.skin);
    if(!back){
      rect(c,20,9,17,5,palette.hair);rect(c,19,12,3,9,palette.hair);
      if(!(left||right)){rect(c,24,19,2,2,'#493d33');rect(c,32,19,2,2,'#493d33');rect(c,28,23,3,1,'#aa7457');}
      else rect(c,right?34:22,18,2,2,'#493d33');
    }
    if(E.head){
      if(E.head==='iron-helm'){
        poly(c,[19,14,20,6,27,3,36,7,39,15,37,21,33,22,34,13,23,13,22,22,19,22],palette.ironShadow);
        poly(c,[20,11,23,6,33,5,37,11,34,13,22,13],palette.iron);
        rect(c,27,5,3,10,'#d3d8d0');rect(c,22,14,3,8,'#8b9b9c');
      }else{
        poly(c,[17,20,18,10,23,5,33,5,39,12,40,20,36,25,35,15,22,14,21,25],palette.cloak);
        rect(c,19,11,3,9,palette.cloakLight);rect(c,33,8,3,6,'#244b3b');
      }
    }
    // Equipped shield is drawn on opposite hand; stance changes with facing.
    if(E.offHand){
      const sx=back?9:left?39:8;
      poly(c,[sx,31,sx+12,28,sx+15,35,sx+12,52,sx+7,57,sx+1,47],'#584333');
      poly(c,[sx+2,33,sx+11,30,sx+12,36,sx+10,48,sx+7,53,sx+3,45],'#a78f60');
      rect(c,sx+6,33,3,18,'#6f4830');rect(c,sx+3,39,10,3,'#d8be75');
    }
    if(E.mainHand) drawHeldWeapon(c, direction, E.mainHand, swingPhase);
    c.restore();
    c.restore(); // Undo wide-canvas centering.
  });
}

const worldSpriteCache={};
export const sprites={
  get(kind,v=0) {
    const key=`${kind}:${v}`;
    if(!worldSpriteCache[key]){
      if(kind==='grass'||kind==='path'||kind==='water')worldSpriteCache[key]=ground(kind,v);
      else if(kind==='tree')worldSpriteCache[key]=tree(v);
      else if(kind==='pine')worldSpriteCache[key]=pine();
      else if(kind==='rock')worldSpriteCache[key]=rock();
      else if(kind==='shrub')worldSpriteCache[key]=shrub(v);
      else if(kind==='flower')worldSpriteCache[key]=flower(v);
      else if(kind==='log')worldSpriteCache[key]=logSprite();
      else if(kind==='chest')worldSpriteCache[key]=chest(!!v);
      else if(kind==='sign')worldSpriteCache[key]=sign();
      else if(kind==='fire')worldSpriteCache[key]=campfire(v);
    }
    return worldSpriteCache[key];
  },
  character(equipment,direction='south',step=false,swingPhase=false){
    const swingKey = swingPhase===false ? false : Math.max(0, Math.min(4, Math.round(swingPhase*4)));
    const key=JSON.stringify([equipment,direction,step,swingKey]);
    if(!worldSpriteCache[key]){
      const drawPhase = swingKey===false ? false : swingKey/4;
      worldSpriteCache[key]=spriteCharacter(direction,equipment,step,drawPhase);
    }
    return worldSpriteCache[key];
  }
};

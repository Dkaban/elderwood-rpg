// Elderwood storybook renderer. Hand-painted canvas shapes, no runtime downloads.
// All sprites are generated once and cached by src/sprites.js.
const P={pine:'#254c3a',pineHi:'#72935d',oak:'#486b3f',oakHi:'#a8ad5d',
 bark:'#63442d',moss:'#7c9761',stone:'#8d9285',sand:'#b6a37d',cream:'#ede1b9'};
const PI=Math.PI;
function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');return {c,g};}
function rng(seed){let n=(seed*196314165+907633515)>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}
function path(g,pts,fill,stroke='',line=1){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.lineWidth=line;g.strokeStyle=stroke;g.stroke();}}
function oval(g,x,y,rx,ry,color){g.beginPath();g.ellipse(x,y,rx,ry,0,0,PI*2);g.fillStyle=color;g.fill();}
function grad(g,x,y,r,stops){const a=g.createRadialGradient(x-r*.3,y-r*.4,2,x,y,r);stops.forEach(([p,c])=>a.addColorStop(p,c));return a;}
function line(g,pts,color,w=1){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();}
function dab(g,x,y,rx,ry,col,angle=0){g.save();g.translate(x,y);g.rotate(angle);oval(g,0,0,rx,ry,col);g.restore();}
function ground(kind,v){
  const {c,g}=surface(84,42),r=rng(17+v*137+(kind==='path'?61:kind==='water'?7:0));
  g.beginPath();g.moveTo(42,0);g.lineTo(84,21);g.lineTo(42,42);g.lineTo(0,21);g.closePath();g.save();g.clip();
  const pathTile=kind==='path',water=kind==='water';
  let base=g.createLinearGradient(0,0,66,40);
  if(pathTile){base.addColorStop(0,'#988769');base.addColorStop(.48,'#b8a780');base.addColorStop(1,'#867b5d');}
  else if(water){base.addColorStop(0,'#36595a');base.addColorStop(.6,'#55766e');base.addColorStop(1,'#2d4d55');}
  else{base.addColorStop(0,v===1?'#628454':'#527847');base.addColorStop(.5,'#729258');base.addColorStop(1,v===2?'#3f6643':'#4c7148');}
  g.fillStyle=base;g.fillRect(0,0,84,42);
  for(let i=0;i<70;i++){let x=r()*88-2,y=r()*44-1,w=.4+r()*5,h=.3+r()*2;
   g.fillStyle=water?(['#729d97','#436e70','#577d75'][i%3]):pathTile?(['#d0bb8c','#786e56','#a79b7c'][i%3]):(['#9da968','#315e3d','#b0ae6b','#5e864c'][i%4]);
   g.globalAlpha=.12+r()*.32;dab(g,x,y,w,h,g.fillStyle,r()*3);g.globalAlpha=1;
  }
  if(pathTile){
    for(let i=0;i<13;i++){const x=r()*82,y=r()*40,rx=4+r()*9,ry=2+r()*5;
      path(g,[[x-rx,y],[x-2,y-ry],[x+rx*.8,y-ry*.6],[x+rx,y+ry*.35],[x+1,y+ry]],i%3===0?'#ab9a78':i%3===1?'#c0ad8a':'#948365','#776d56',.55);
      line(g,[[x-rx*.55,y-ry*.3],[x,y-ry*.7],[x+rx*.55,y-ry*.3]],'rgba(238,223,176,.45)',.8);
    }
  } else if(water){
    for(let i=0;i<10;i++){const x=r()*84,y=r()*40;line(g,[[x,y],[x+3+r()*5,y-1]],'rgba(199,225,205,.28)',.65);}
  } else {
    for(let i=0;i<18;i++){const x=r()*84,y=r()*42;line(g,[[x,y+2],[x-1,y-1-r()*2]],r()<.45?'rgba(202,190,111,.58)':'rgba(29,84,49,.55)',.7);}
    if(v===2)for(let i=0;i<4;i++){const x=r()*70+6,y=r()*30+6;oval(g,x,y,1.5,1,r()<.5?'#e4d9a4':'#bfa9c7');}
  }
  g.restore();
  return c;
}
function oak(v){
  const {c,g}=surface(250,284),r=rng(88+v*31),cx=120;
  oval(g,cx,259,57,13,'rgba(15,35,23,.16)');
  // Sloping trunk, bark grooves and spreading limbs.
  const bark=g.createLinearGradient(94,0,146,0);bark.addColorStop(0,'#392f27');bark.addColorStop(.52,'#966d3f');bark.addColorStop(1,'#4c3929');
  path(g,[[101,257],[107,191],[91,134],[100,115],[124,155],[134,123],[148,113],[138,175],[142,258]],bark,'#4e4532',2);
  line(g,[[111,252],[119,195],[115,162],[104,145]],'rgba(219,168,95,.48)',4);
  line(g,[[128,249],[132,206],[124,164],[138,138]],'rgba(46,45,31,.45)',3);
  // Big irregular shapes make the crown look naturally painted, not like pixel blocks.
  const masses=[[104,102,64,54],[64,119,50,44],[159,106,63,47],[111,61,58,50],[180,147,46,36],[53,161,47,33],[112,157,73,40],[159,66,43,35]];
  for(let i=0;i<masses.length;i++){
    const [x,y,rx,ry]=masses[i];
    oval(g,x+4,y+9,rx+4,ry+5,'rgba(21,51,38,.65)');
    oval(g,x,y,rx,ry,grad(g,x-4,y-4,Math.max(rx,ry)*1.28,[[0, ['#b9b967','#a4b16b','#c8b66d'][v%3]],[.39,['#769455','#759c59','#9a9850'][v%3]],[1,'#355943']]));
  }
  for(let i=0;i<580;i++){
    const m=masses[Math.floor(r()*masses.length)];const [x,y,rx,ry]=m;
    const a=r()*PI*2,rad=Math.sqrt(r())*.9;
    const px=x+Math.cos(a)*rx*rad,py=y+Math.sin(a)*ry*rad;
    const light=r();
    const col=light>.77?'rgba(231,208,115,.80)':light>.42?'rgba(166,184,95,.72)':'rgba(46,100,63,.38)';
    dab(g,px,py,1+r()*3,.6+r()*1.9,col,r()*2);
  }
  return c;
}
function pine(v){
  const {c,g}=surface(194,276),r=rng(144+v*77),x=96;
  oval(g,x,257,44,9,'rgba(12,40,28,.21)');
  path(g,[[89,257],[89,113],[97,68],[105,119],[106,257]],'#6c4a30');
  line(g,[[96,127],[96,250]],'#a0804e',3);
  const widths=[31,43,55,64,72],ys=[60,93,129,168,207];
  for(let layer=0;layer<5;layer++){
    const y=ys[layer],w=widths[layer];
    path(g,[[x,y-37],[x-w-7,y+25],[x-w*.47,y+17],[x-w*.9,y+36],[x+w*.8,y+36],[x+w*.5,y+18],[x+w+7,y+25]],'#1e493e');
    path(g,[[x,y-37],[x-w*.9,y+18],[x-w*.4,y+13],[x-w*.8,y+29],[x+w*.6,y+28],[x+w*.3,y+13],[x+w*.8,y+18]],grad(g,x-8,y,83,[[0,'#789768'],[.52,'#3f7456'],[1,'#244d43']]));
    for(let i=0;i<75;i++){const py=y-26+r()*54,ratio=Math.max(0,1-(py-(y-37))/86),xx=x+(r()-.5)*w*2.2*(1-.36*ratio);
      line(g,[[xx,py],[xx+(r()-.5)*7,py+2+r()*6]],i%5===0?'rgba(182,188,113,.48)':'rgba(29,68,50,.34)',.6+r()*.9);
    }
  }
  return c;
}
function rock(v){
 const {c,g}=surface(105,71),r=rng(210+v);
 oval(g,50,61,44,8,'rgba(30,43,30,.25)');
 path(g,[[9,50],[19,29],[38,15],[63,10],[88,27],[97,52],[79,62],[23,61]],'#707c70','#46594e',2);
 path(g,[[19,29],[38,15],[63,10],[68,29],[44,40],[9,50]],grad(g,34,24,78,[[0,'#b9bbaa'],[.6,'#929c8b'],[1,'#647b72']]));
 path(g,[[68,29],[88,27],[97,52],[79,62],[50,55]],'#6b7974');
 line(g,[[37,17],[49,25],[60,23]],'rgba(243,230,195,.5)',2);
 for(let i=0;i<33;i++){const x=18+r()*67,y=22+r()*33;dab(g,x,y,1+r()*4,1+r()*2,r()<.5?'rgba(91,119,68,.37)':'rgba(205,191,159,.24)');}
 return c;
}
function shrub(v){
 const {c,g}=surface(92,78),r=rng(79+v*63);
 oval(g,47,68,36,7,'rgba(21,56,37,.2)');
 for(let k=0;k<13;k++){const x=14+r()*63,y=34+r()*25,rad=12+r()*13;
    oval(g,x,y+4,rad,rad*.64,'#365f3f');oval(g,x,y,rad*.9,rad*.56,grad(g,x-3,y-4,rad,[[0,'#a5b56c'],[.56,'#739758'],[1,'#315e45']]));
 }
 for(let i=0;i<60;i++){const x=16+r()*63,y=29+r()*32;dab(g,x,y,1+r()*2,1+r()*1.3,i%4?'rgba(187,191,109,.35)':'rgba(41,88,58,.3)');}
 return c;
}
function flower(v){
 const {c,g}=surface(66,54),r=rng(399+v*55);
 for(let i=0;i<11;i++){
  const x=7+r()*52,y=13+r()*29;
  line(g,[[x,y+17],[x-1,y+7],[x+1,y]],'#608047',1.7);
  const color=v===0?'#f1e6c4':'#c7b0d8';
  for(let p=0;p<5;p++){const a=p*PI*2/5;oval(g,x+Math.cos(a)*3,y+Math.sin(a)*3,2.6,2.4,color);}
  oval(g,x,y,1.5,1.5,'#c7a75f');
 }return c;
}
function logSprite(){
 const {c,g}=surface(96,60);oval(g,48,51,45,7,'rgba(31,41,25,.23)');
 path(g,[[12,21],[69,18],[86,32],[28,41]],'#8e623f','#574432',2);
 path(g,[[28,41],[86,32],[84,44],[24,54]],'#67462f');
 oval(g,18,36,12,15,'#bd9364');oval(g,18,36,7,10,'#906743');oval(g,18,36,3,5,'#bb8c5d');
 line(g,[[36,30],[74,25]],'rgba(235,191,123,.7)',2);
 return c;
}
function chest(open){
 const {c,g}=surface(98,93);oval(g,50,81,43,10,'rgba(45,34,19,.23)');
 path(g,[[13,36],[47,23],[85,36],[51,50]],'#7c482d','#563b30',2);
 path(g,[[13,36],[51,50],[51,80],[13,64]],'#8e5836','#533724',2);
 path(g,[[51,50],[85,36],[85,65],[51,80]],'#a06e45','#64432f',2);
 if(open){path(g,[[12,32],[45,10],[84,24],[52,47]],'#69472e','#3c2c25',2);path(g,[[22,31],[46,17],[72,24],[51,40]],'#282a24');}
 else{path(g,[[13,36],[47,23],[85,36],[51,50]],'#b4834f','#6d4b31',2);}
 for(const x of [21,68]){line(g,[[x,38],[x,68]],'#e0bd73',4);line(g,[[x+2,38],[x+2,69]],'#72542f',1);}
 path(g,[[47,49],[56,49],[56,66],[47,66]],'#e3c574','#806439',1);
 return c;
}
function sign(){
 const {c,g}=surface(99,149);
 oval(g,49,139,22,6,'rgba(15,37,25,.19)');
 line(g,[[42,134],[41,34]],'#664a31',8);line(g,[[45,125],[45,36]],'#b18a56',2);
 line(g,[[15,41],[79,39]],'#5a4331',13);line(g,[[15,37],[79,34]],'#a17a4b',4);
 path(g,[[22,50],[72,47],[67,96],[47,111],[26,97]],'#853d36','#b39458',2);
 line(g,[[46,58],[46,91]],'#d9bd77',2);line(g,[[32,77],[45,65],[59,77],[45,95]],'#dcc17b',1.8);
 return c;
}
function fire(v){
 const {c,g}=surface(100,103),r=rng(105+v);
 oval(g,51,88,42,12,'rgba(38,31,19,.25)');
 for(let i=0;i<13;i++){let a=i*2*PI/13;oval(g,51+Math.cos(a)*30,84+Math.sin(a)*9,8,4,i%2?'#81877a':'#a1a28b');}
 line(g,[[34,88],[66,79]],'#64442d',7);line(g,[[37,78],[65,90]],'#885c37',6);
 const glow=grad(g,51,59,53,[[0,'rgba(255,218,125,.43)'],[1,'rgba(255,180,70,0)']]);oval(g,51,62,51,40,glow);
 path(g,[[38,82],[43,59],[45,68],[52,35],[56,64],[64,51],[67,81]],'#eb7b39');
 path(g,[[45,80],[48,58],[52,69],[55,48],[61,81]],'#f9c96b');
 path(g,[[50,80],[53,64],[57,80]],'#fff2bd');
 return c;
}
function dummy(v){
 const {c,g}=surface(112,167);
 oval(g,57,155,38,9,'rgba(24,36,23,.22)');
 line(g,[[55,149],[55,47]],'#795434',11);
 line(g,[[22,72],[91,72]],'#735335',11);
 path(g,[[37,37],[73,34],[81,101],[66,126],[42,125],[33,100]],v?'#c4a575':'#c2ab7b','#7d704f',3);
 path(g,[[42,30],[54,23],[68,29],[72,47],[39,49]],'#c6b184','#756a4a',2);
 for(let i=0;i<5;i++)oval(g,56,72,21-i*3,21-i*3,['#8d6543','#d5b67c','#a06951','#e5c885','#9f5940'][i]);
 for(let i=0;i<22;i++)line(g,[[38+i%8*5,45],[36+i%8*5,47+i%4*4]],'rgba(231,207,133,.35)',.7);
 return c;
}
export function storySprite(kind,v=0){
 if(kind==='grass'||kind==='path'||kind==='water')return ground(kind,v);
 if(kind==='tree')return oak(v);
 if(kind==='pine')return pine(v);
 if(kind==='rock')return rock(v);
 if(kind==='shrub')return shrub(v);
 if(kind==='flower')return flower(v);
 if(kind==='log')return logSprite();
 if(kind==='chest')return chest(!!v);
 if(kind==='sign')return sign();
 if(kind==='fire')return fire(v);
 if(kind==='dummy')return dummy(v);
 return null;
}

function cloth(g,pts,color,outline='#493b30'){path(g,pts,color,outline,1.5);}
function sword(g,x,y,a,staff=false){
 g.save();g.translate(x,y);g.rotate(a);
 if(staff){line(g,[[0,12],[0,-42]],'#67442c',6);line(g,[[0,-2],[0,-43]],'#c49e61',2);oval(g,0,-43,4,5,'#678658');}
 else{
  // Leather grip, crossguard and tapered iron blade.
  line(g,[[0,12],[0,-7]],'#68452e',5);
  line(g,[[-10,-8],[10,-8]],'#c5a368',4);
  path(g,[[-3,-9],[-4,-32],[0,-48],[4,-32],[3,-9]],'#cad0ca','#647471',1);
  line(g,[[0,-13],[0,-42]],'rgba(255,251,221,.89)',1.5);
 }
 g.restore();
}
const ATTACK={
 north:{start:-2.7,end:-.35}, south:{start:.35,end:2.7},
 east:{start:-1.15,end:1.15},west:{start:-2.0,end:-4.3}
};
export function storyCharacter(e,d='south',step=false,phase=false){
 const {c,g}=surface(220,148),back=d==='north',left=d==='west',right=d==='east';
 const running=step?1:0;
 const active=phase!==false;
 const p=active?Math.max(0,Math.min(1,phase)):0;
 const strike=active?Math.sin(PI*p):0;
 const side=left?-1:1,bodyX=110+(active?side*strike*1.6:0);
 oval(g,110,136,26,6,'rgba(29,38,20,.23)');
 g.save();g.translate(bodyX,step?Math.sin(running*PI)*1:0);
 // A wind-swept lined cloak with an organic outline.
 if(e.cloak){
  cloth(g,[[-17,68],[-29,97],[-22,120],[-11,116],[1,120],[18,110],[20,84],[14,66]],'#754532','#453b2d');
  cloth(g,[[-16,72],[-24,110],[-13,112],[-5,105],[9,112],[14,82]],'#985d3d','');
  line(g,[[-10,71],[-16,101],[-11,112]],'rgba(215,163,103,.59)',1.3);
 } else {
  cloth(g,[[-15,66],[-14,101],[-1,106],[14,98],[15,69]],'#ae9b78','#6a5841');
 }
 // Shaded trousers and boots.
 const trouser=e.legs?'#544d3d':'#85725a';
 cloth(g,[[-13,99],[-12,119],[-5,123],[-1,103]],trouser);
 cloth(g,[[1,102],[3,124],[12,121],[14,100]],trouser);
 cloth(g,[[-14,118],[-17,133],[-3,134],[-2,122]],e.feet?'#614832':'#8d7252');
 cloth(g,[[3,121],[3,134],[18,132],[13,119]],e.feet?'#614832':'#8d7252');
 line(g,[[-17,130],[-3,132]],'#3a342c',2);line(g,[[3,133],[19,131]],'#3a342c',2);
 // Torso: cream tunic with leather mail or shimmering metal.
 const metal=e.chest==='iron-hauberk',vest=e.chest==='leather-vest';
 const bod=metal?'#8c9990':vest?'#77533c':'#e1c69b';
 cloth(g,[[-17,63],[-21,76],[-15,106],[14,106],[21,76],[14,62]],bod,'#5a4839');
 if(metal){
   for(let y=73;y<99;y+=6){line(g,[[-13,y],[12,y]],'rgba(213,214,190,.55)',2);for(let x=-11;x<14;x+=5)oval(g,x+(y%2)*.8,y+2,1,1,'#576b6b');}
 }else if(vest){
   cloth(g,[[-16,67],[-6,66],[-3,99],[-16,98]],'#9a714d','');
   cloth(g,[[8,66],[16,68],[15,96],[5,100]],'#4e4133','');
   line(g,[[-9,71],[8,98]],'#d6ad6a',1.6);
 }else{
   line(g,[[-8,69],[8,99]],'rgba(147,102,65,.55)',2);
 }
 line(g,[[-15,100],[15,100]],'#503e30',5);
 oval(g,0,100,3,3,'#dfbb74');
 // Legs and chest sit ahead of shield and cloak.
 // Shoulders, arms and gripping hand follow the same strike trajectory as blade.
 const sleeve=metal?'#748585':vest?'#795540':'#c3aa80';
 let hand={x:right?20:-21,y:94},swordAngle=0;
 if(active){
   const ar=ATTACK[d]||ATTACK.south;
   const u=Math.max(0,Math.min(1,(p-.1)/.63));const eased=u*u*(3-2*u);
   swordAngle=ar.start+(ar.end-ar.start)*eased+PI/2;
   hand={x:Math.cos(swordAngle-PI/2)*27,y:77+Math.sin(swordAngle-PI/2)*20};
   const elbow={x:(hand.x+(side*14))*.5,y:(hand.y+72)*.5-3*strike};
   line(g,[[side*16,72],[elbow.x,elbow.y]],sleeve,9);
   line(g,[[elbow.x,elbow.y],[hand.x,hand.y]],'#caa67c',6);
   oval(g,hand.x,hand.y,3.9,4,'#e7bf91');
 }else{
   cloth(g,[[right?-16:-20,69],[right?-25:-24,75],[-20,97],[-11,98],[-8,80]],sleeve,'');
   cloth(g,[[right?14:12,69],[23,73],[24,96],[15,98],[10,81]],sleeve,'');
   oval(g,right?21:-19,95,4,4,'#dab38b');
 }
 // Cloak pin, neck and face.
 oval(g,0,65,7,6,'#d4aa78');
 const face=grad(g,0,46,27,[[0,'#f3d6a1'],[.62,'#d8a97c'],[1,'#a97758']]);
 oval(g,0,47,13,17,back?'#4c392d':face);
 if(!back){
  oval(g,left?-5:right?5:0,47,2.3,2.5,'rgba(170,103,69,.20)');
  const eyeX=left?-7:right?6:5;oval(g,eyeX,47,1.2,1.5,'#44382c');
  if(!left&&!right)oval(g,-5,47,1.2,1.5,'#44382c');
 }
 // Tossed hair with irregular locks.
 if(e.head==='iron-helm'){
  cloth(g,[[-15,44],[-14,33],[-7,27],[7,27],[14,33],[16,46]],'#8d9992','#52635d');
  path(g,[[-13,38],[-8,31],[8,31],[13,38]],'#d0d2be');
  line(g,[[1,28],[1,42]],'#66736d',2);
 } else if(e.head==='wool-hood'){
  cloth(g,[[-17,49],[-17,32],[-8,25],[10,24],[19,33],[18,51],[11,42],[10,36],[-9,35],[-11,49]],'#4d6548','#293d36');
  line(g,[[-12,33],[-8,27],[8,27]],'#8f9866',2);
 }else{
  cloth(g,[[-13,40],[-16,34],[-9,28],[-4,31],[3,26],[7,30],[13,28],[14,40],[8,36],[4,34],[-4,38]],'#503729','#342a23');
  for(let i=0;i<9;i++)line(g,[[-12+i*3,32],[-11+i*3,29-(i%3)*2]],i%2?'#7e5739':'#3a2d25',1.4);
 }
 // Shield: a decorated leather-and-iron heater.
 if(e.offHand){
  const sx=left?23:-25;
  path(g,[[sx-10,77],[sx+12,75],[sx+11,96],[sx,110],[sx-10,96]],'#6c4b32','#cdb17a',2.5);
  path(g,[[sx-7,80],[sx+8,79],[sx+8,96],[sx,105],[sx-7,94]],'#a07846');
  line(g,[[sx,80],[sx,104]],'#ddbf78',2);
 }
 // Weapon is shown in the gripping hand, not hovering by the head.
 if(e.mainHand){
  if(active){
    sword(g,hand.x,hand.y,swordAngle,e.mainHand==='oak-staff');
    if(p>.22&&p<.74){
      const ar=ATTACK[d]||ATTACK.south;const u=Math.min(1,(p-.1)/.63);
      g.save();g.globalAlpha=.45*Math.sin(PI*(p-.22)/.52);g.beginPath();
      const prev=Math.max(0,u-.2),st=ar.start+(ar.end-ar.start)*prev,ed=ar.start+(ar.end-ar.start)*u;
      for(let i=0;i<=10;i++){const a=st+(ed-st)*i/10;const x=Math.cos(a)*53,y=76+Math.sin(a)*40;
        i===0?g.moveTo(x,y):g.lineTo(x,y);}
      g.strokeStyle='#f7e9b7';g.lineWidth=3;g.stroke();g.restore();
    }
  }else{sword(g,right?26:-25,92,0,e.mainHand==='oak-staff');}
 }
 g.restore();
 return c;
}
export function storyAnimal(type,step=0,facing='right'){
 const sizes={rabbit:[76,65],deer:[138,111],fox:[106,76],squirrel:[75,64],bird:[58,52]};
 const [w,h]=sizes[type]||[70,60],{c,g}=surface(w,h);
 const r=rng(type.length*23+step*13),flip=facing==='left';
 g.save();if(flip){g.translate(w,0);g.scale(-1,1);}
 oval(g,w*.5,h-8,w*.35,5,'rgba(30,37,23,.22)');
 if(type==='deer'){
  const x=w*.47;
  // Spotted warm-brown deer with four articulated legs.
  for(const xx of [x-25,x-5,x+13,x+30])line(g,[[xx,h-44],[xx+(xx<x?2:5),h-10]],'#876342',5);
  oval(g,x,h-54,42,23,grad(g,x-12,h-63,52,[[0,'#d0a372'],[.5,'#a46c44'],[1,'#765036']]));
  line(g,[[x+27,h-64],[x+46,h-88]],'#9f734f',14);
  oval(g,x+51,h-88,13,11,'#b98b60');
  dab(g,x+43,h-99,8,4,'#a27a5b',-.5);dab(g,x+62,h-100,8,4,'#a27a5b',.7);
  oval(g,x+61,h-89,1.5,1.5,'#352d24');
  for(let i=0;i<15;i++)oval(g,x-33+r()*65,h-64+r()*22,2.2,1.7,'rgba(243,217,169,.7)');
  if(step===0){line(g,[[x+45,h-102],[x+41,h-112]],'#876c4c',2);}
 } else if(type==='fox'){
  oval(g,w*.67,h-24,29,17,'#b8703e');
  path(g,[[40,h-24],[11,h-49],[9,h-30],[35,h-14]],'#c8814b');
  path(g,[[10,h-48],[9,h-30],[22,h-24]],'#eee1b8');
  for(const x of [52,78])line(g,[[x,h-23],[x,h-8]],'#543c2d',5);
  path(g,[[74,h-37],[82,h-58],[91,h-49],[101,h-60],[103,h-35],[92,h-22]],'#be824b');
  path(g,[[89,h-33],[104,h-30],[95,h-21],[84,h-27]],'#f0d6b5');
  oval(g,98,h-43,1.5,1.5,'#352b25');
 } else if(type==='rabbit'){
  oval(g,35,43,23,15,grad(g,29,35,29,[[0,'#e0d5bd'],[.7,'#aa9b85'],[1,'#777667']]));
  oval(g,52,39,13,12,'#c9bda7');
  dab(g,51,15,4,19,'#beaf9a',-.12);dab(g,61,18,4,17,'#c5b4a3',.22);
  line(g,[[52,10],[53,22]],'#dca6a2',2);
  oval(g,62,38,1.4,1.4,'#493e38');
  oval(g,10,41,7,8,'#eee2c8');oval(g,48,54,12,5,'#d9cbb3');
 }else if(type==='squirrel'){
  oval(g,37,40,16,13,'#a96c3f');oval(g,48,34,12,10,'#bb814e');
  line(g,[[24,40],[12,17],[20,13],[27,27]],'#9a6037',12);
  oval(g,52,32,2,2,'#322b23');
  for(const x of [28,42])line(g,[[x,46],[x,56]],'#785039',3);
 }else{
  oval(g,27,32,15,10,'#6c86a0');oval(g,43,27,9,8,'#86a0ac');
  path(g,[[19,32],[9,21],[28,28],[33,40]],'#4f6c8a');
  path(g,[[49,28],[57,31],[49,34]],'#c6a25d');
  oval(g,47,26,1.3,1.5,'#352f24');
  line(g,[[31,40],[30,46]],'#6b5744',1.5);
 }
 g.restore();
 return c;
}

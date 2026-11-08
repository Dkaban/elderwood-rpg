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

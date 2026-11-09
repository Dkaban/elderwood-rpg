// Elderwood Combat Lab: illustrated frame atlas and combat rules.
// One 8-frame authored attack per direction; timed hitboxes use the active phase.
export const CONFIG=Object.freeze({
  speed:190,playerRadius:17,
  windup:105,active:135,recovery:165,
  reach:104,arc:98,hitstop:48
});
export const DIRECTION_ROWS=Object.freeze({south:0,east:1,north:2,west:3});
export const SPRITE_SHEET=Object.freeze({
  src:'./assets/hero-attack-sheet.webp?v=approved-2',
  width:1200,height:600,frameWidth:150,frameHeight:150,
  columns:8,rows:4,
  animations:Object.freeze({
    attack:Object.freeze({start:0,count:8,windup:[0,1],active:[2,3,4],recovery:[5,6,7]}),
    idle:Object.freeze({start:0,count:1}),
    walk:Object.freeze({start:0,count:1})
  })
});
export function facingVector(facing){
  switch(facing){
    case 'north':return {x:0,y:-1};
    case 'south':return {x:0,y:1};
    case 'west':return {x:-1,y:0};
    case 'east':return {x:1,y:0};
    default:return {x:1,y:0};
  }
}
export function attackPhase(elapsed,cfg=CONFIG){
  if(elapsed<cfg.windup)return 'windup';
  if(elapsed<cfg.windup+cfg.active)return 'active';
  return 'recovery';
}
export function attackFrame(elapsed,cfg=CONFIG){
  const phase=attackPhase(elapsed,cfg);
  if(phase==='windup')return Math.min(1,Math.floor(elapsed/cfg.windup*2));
  if(phase==='active')return 2+Math.min(2,Math.floor((elapsed-cfg.windup)/cfg.active*3));
  return 5+Math.min(2,Math.floor((elapsed-cfg.windup-cfg.active)/cfg.recovery*3));
}
export function frameAt(facing,animation,n){
  const row=DIRECTION_ROWS[facing]??0;
  const set=SPRITE_SHEET.animations[animation]||SPRITE_SHEET.animations.idle;
  const col=set.start+((Math.floor(n)%set.count+set.count)%set.count);
  return {
    x:col*SPRITE_SHEET.frameWidth,y:row*SPRITE_SHEET.frameHeight,
    width:SPRITE_SHEET.frameWidth,height:SPRITE_SHEET.frameHeight,
    col,row,flipX:facing==='west'
  };
}
export function hitsDummy(player,dummy,cfg=CONFIG){
  if(dummy.hp<=0)return false;
  const dx=dummy.x-player.x,dy=dummy.y-player.y;
  const distance=Math.hypot(dx,dy);
  if(distance<.01||distance>cfg.reach+dummy.radius)return false;
  const dir=facingVector(player.facing);
  const dot=(dx*dir.x+dy*dir.y)/distance;
  return dot>=Math.cos(cfg.arc*Math.PI/360);
}

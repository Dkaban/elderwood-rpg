// Public tuning parameters for Elderwood Combat Lab.
// Units are CSS/world pixels and milliseconds, never image pixels.
export const CONFIG=Object.freeze({
  speed:190,
  playerRadius:17,
  windup:145,
  active:115,
  recovery:190,
  reach:109,
  arc:104,
  hitstop:58
});
export const DIRECTION_ROWS=Object.freeze({south:0,west:1,north:2,east:3});
export const SPRITE_SHEET=Object.freeze({
  width:2592,height:640,
  frameWidth:144,frameHeight:160,
  columns:18,rows:4,
  animations:Object.freeze({
    attack:Object.freeze({start:0,count:8,windup:[0,1,2],active:[3,4,5],recovery:[6,7]}),
    walk:Object.freeze({start:8,count:6}),
    idle:Object.freeze({start:14,count:4})
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
export function attackPhase(elapsed, cfg=CONFIG){
  if(elapsed<cfg.windup)return 'windup';
  if(elapsed<cfg.windup+cfg.active)return 'active';
  return 'recovery';
}
export function frameAt(facing, animation, n){
  const row=DIRECTION_ROWS[facing]??0;
  const set=SPRITE_SHEET.animations[animation]||SPRITE_SHEET.animations.idle;
  const col=set.start+(Math.floor(n)%set.count+set.count)%set.count;
  return {x:col*SPRITE_SHEET.frameWidth,y:row*SPRITE_SHEET.frameHeight,
          width:SPRITE_SHEET.frameWidth,height:SPRITE_SHEET.frameHeight,col,row};
}
// Circle versus a forward arc. The dummy has a real radius; it must face
// within the attack cone and be within weapon reach + its collision radius.
export function hitsDummy(player,dummy,cfg=CONFIG){
  if(dummy.hp<=0)return false;
  const dx=dummy.x-player.x,dy=dummy.y-player.y;
  const distance=Math.hypot(dx,dy);
  if(distance<.01 || distance>cfg.reach+dummy.radius)return false;
  const dir=facingVector(player.facing);
  const dot=(dx*dir.x+dy*dir.y)/distance;
  return dot>=Math.cos(cfg.arc*Math.PI/360);
}

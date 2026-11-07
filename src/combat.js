// Attack reach is measured in projected screen pixels, matching the debug wedge.
export const ATTACK_REACH = 96;
export const ATTACK_HALF_ANGLE = Math.PI * 0.31;
export const FACING = Object.freeze({
  north: {x:0,y:-1}, south: {x:0,y:1},
  east: {x:1,y:0}, west: {x:-1,y:0}
});

// Coordinates are relative to the combatant at the SAME body height.
export function isInAttackArc(attacker, target, direction) {
  const axis=FACING[direction]||FACING.south;
  const dx=target.x-attacker.x, dy=target.y-attacker.y;
  const distance=Math.hypot(dx,dy);
  if(distance>ATTACK_REACH || distance<1)return false;
  return (dx*axis.x + dy*axis.y)/distance >= Math.cos(ATTACK_HALF_ANGLE);
}

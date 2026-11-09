import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG, SPRITE_SHEET, DIRECTION_ROWS, attackPhase, facingVector, frameAt, hitsDummy} from '../src/combat-data.js';

test('sprite sheet has 72 fixed frames and correct directional rows',()=>{
  assert.equal(SPRITE_SHEET.columns*SPRITE_SHEET.rows,72);
  assert.deepEqual(DIRECTION_ROWS,{south:0,west:1,north:2,east:3});
  assert.deepEqual(frameAt('west','attack',3),{x:432,y:160,width:144,height:160,col:3,row:1});
  assert.equal(frameAt('north','walk',0).col,8);
  assert.equal(frameAt('east','idle',0).col,14);
});
test('windup, active, recovery boundaries are deterministic',()=>{
  assert.equal(attackPhase(0),'windup');
  assert.equal(attackPhase(CONFIG.windup-1),'windup');
  assert.equal(attackPhase(CONFIG.windup),'active');
  assert.equal(attackPhase(CONFIG.windup+CONFIG.active),'recovery');
});
test('each facing direction hits only its forward target',()=>{
  const p={x:0,y:0}; const configs=[['north',0,-75],['south',0,75],['west',-75,0],['east',75,0]];
  for(const [dir,x,y] of configs){
    const v=facingVector(dir);
    assert.deepEqual(v,{x:x===0?0:Math.sign(x),y:y===0?0:Math.sign(y)});
    assert.equal(hitsDummy({...p,facing:dir},{x,y,hp:100,radius:28}),true,dir);
    assert.equal(hitsDummy({...p,facing:dir},{x:-x,y:-y,hp:100,radius:28}),false,dir+' reverse');
  }
});
test('range, cone width and defeated targets prevent hits',()=>{
  const p={x:0,y:0,facing:'east'};
  assert.equal(hitsDummy(p,{x:250,y:0,hp:100,radius:28}),false);
  assert.equal(hitsDummy(p,{x:50,y:120,hp:100,radius:28}),false);
  assert.equal(hitsDummy(p,{x:70,y:0,hp:0,radius:28}),false);
  assert.equal(hitsDummy(p,{x:70,y:0,hp:100,radius:28}),true);
});

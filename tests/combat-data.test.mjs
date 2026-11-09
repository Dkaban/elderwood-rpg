import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG,SPRITE_SHEET,DIRECTION_ROWS,attackPhase,attackFrame,frameAt,facingVector,hitsDummy} from '../src/combat-data.js';

test('approved sheet is 8 by 4 with row-based directions',()=>{
 assert.equal(SPRITE_SHEET.columns*SPRITE_SHEET.rows,32);
 assert.equal(SPRITE_SHEET.frameWidth,150);assert.equal(SPRITE_SHEET.frameHeight,150);
 assert.deepEqual(DIRECTION_ROWS,{south:0,east:1,north:2,west:3});
 assert.deepEqual(frameAt('east','attack',3),{x:450,y:150,width:150,height:150,col:3,row:1,flipX:false});
 assert.equal(frameAt('west','attack',4).flipX,true);
});
test('attack frames follow wind-up, active, recovery phases',()=>{
 assert.equal(attackPhase(0),'windup');
 assert.equal(attackPhase(CONFIG.windup-1),'windup');
 assert.equal(attackPhase(CONFIG.windup),'active');
 assert.equal(attackPhase(CONFIG.windup+CONFIG.active),'recovery');
 for(const t of [0,CONFIG.windup*.5])assert.ok([0,1].includes(attackFrame(t)));
 for(const t of [CONFIG.windup,CONFIG.windup+CONFIG.active*.5])assert.ok([2,3,4].includes(attackFrame(t)));
 for(const t of [CONFIG.windup+CONFIG.active,CONFIG.windup+CONFIG.active+CONFIG.recovery*.5])assert.ok([5,6,7].includes(attackFrame(t)));
});
test('all four directions hit forward but never backward',()=>{
 const p={x:0,y:0};
 for(const [dir,x,y] of [['north',0,-75],['south',0,75],['west',-75,0],['east',75,0]]){
  assert.equal(hitsDummy({...p,facing:dir},{x,y,hp:100,radius:28}),true);
  assert.equal(hitsDummy({...p,facing:dir},{x:-x,y:-y,hp:100,radius:28}),false);
 }
});
test('range, facing cone and target health matter',()=>{
 const p={x:0,y:0,facing:'east'};
 assert.equal(hitsDummy(p,{x:240,y:0,hp:100,radius:28}),false);
 assert.equal(hitsDummy(p,{x:50,y:130,hp:100,radius:28}),false);
 assert.equal(hitsDummy(p,{x:75,y:0,hp:0,radius:28}),false);
 assert.equal(hitsDummy(p,{x:75,y:0,hp:100,radius:28}),true);
});

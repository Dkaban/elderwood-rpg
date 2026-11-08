import {hash,MAP_SIZE} from './world.js?v=quiet-20261108-r1';

const SPECIES=['rabbit','rabbit','deer','fox','squirrel','bird'];
const SPEED={rabbit:1.12,deer:.94,fox:1.20,squirrel:1.25,bird:1.16};

function animal(type,x,y,n) {
  return {
    type,x,y,homeX:x,homeY:y,
    heading:hash(n,11,3)*Math.PI*2,
    idle:hash(n,31,7)*1.5,
    timer:.3+hash(n,17,5)*2.7,
    step:hash(n,29,8)*10,
    facing:hash(n,23,4)<.5?'left':'right',
    turns:0
  };
}

export function createWildlife(world){
  const animals=[];
  // Guarantee a few animals around the starting clearing so the world feels alive immediately.
  for(const [type,x,y] of [
    ['rabbit',27.3,28.1],['deer',32.0,28.9],['fox',26.2,30.8],['bird',25.2,29.8]
  ]) {
    if(!world.collides(x,y,.2))animals.push(animal(type,x,y,animals.length+1));
  }
  // Deterministic random distribution; does not change every page load.
  for(let y=4;y<MAP_SIZE-4;y+=3)for(let x=4;x<MAP_SIZE-4;x+=3){
    if(hash(x,y,77)>.11)continue;
    const px=x+.25+hash(x,y,19)*1.5,py=y+.25+hash(x,y,20)*1.5;
    if(Math.hypot(px-29,py-29)<6.5||world.collides(px,py,.22))continue;
    const choice=Math.floor(hash(x,y,21)*SPECIES.length);
    animals.push(animal(SPECIES[choice],px,py,y*MAP_SIZE+x));
  }
  return animals;
}

export function updateWildlife(animals,world,player,dt){
  for(const a of animals){
    const fromPlayer=Math.hypot(a.x-player.x,a.y-player.y);
    const fleeing=fromPlayer<2.7 && fromPlayer>.02;
    a.timer-=dt;
    if(a.timer<=0 && !fleeing){
      a.turns++;
      const r=hash(Math.floor(a.homeX*10)+a.turns,Math.floor(a.homeY*10),31);
      a.heading=r*Math.PI*2;
      a.idle=.3+hash(a.turns,Math.floor(a.x*3),42)*1.5;
      a.timer=1+hash(a.turns,Math.floor(a.y*3),43)*3.0;
    }
    // Wildlife retreats from the player but cannot be attacked in this peaceful prototype.
    let heading=fleeing?Math.atan2(a.y-player.y,a.x-player.x):a.heading;
    let speed=fleeing?SPEED[a.type]*1.7:(a.idle>0?0:SPEED[a.type]*.54);
    a.idle=Math.max(0,a.idle-dt);
    // Gently return wandering creatures toward their home rather than drifting away forever.
    if(!fleeing && Math.hypot(a.x-a.homeX,a.y-a.homeY)>3.5){
      heading=Math.atan2(a.homeY-a.y,a.homeX-a.x);speed=SPEED[a.type]*.72;
    }
    if(speed===0)continue;
    const dx=Math.cos(heading)*speed*dt,dy=Math.sin(heading)*speed*dt;
    const nx=a.x+dx,ny=a.y+dy;
    if(world.collides(nx,ny,.14)){
      a.heading+=Math.PI*.72;
      a.timer=.45;
      a.idle=.15;
      continue;
    }
    a.x=nx;a.y=ny;a.step+=dt*speed*9;
    // A world x increase and y decrease point right on the isometric screen.
    const screenDx=dx-dy;
    if(Math.abs(screenDx)>.002)a.facing=screenDx>0?'right':'left';
  }
}

export const MAP_SIZE = 58;
export const TILE_W = 84;
export const TILE_H = 42;
export const START = {x:29, y:29};

export function hash(x,y,salt=0){
  let n=Math.imul(x+37,374761393)+Math.imul(y+19,668265263)+Math.imul(salt+1,1442695041);
  n=(n^(n>>>13)); n=Math.imul(n,1274126177); n^=n>>>16;
  return (n>>>0)/4294967295;
}
const distance=(x,y,a,b)=>Math.hypot(x-a,y-b);
export function project(x,y) {return {x:(x-y)*TILE_W/2,y:(x+y)*TILE_H/2};}
export function unproject(sx,sy) {return {x:sy/TILE_H+sx/TILE_W,y:sy/TILE_H-sx/TILE_W};}

function pathX(y){return 29+4*Math.sin(y*.22)+2*Math.cos(y*.43);}
function isGlade(x,y){return distance(x,y,29,29) < 7;}
function isPath(x,y){return Math.abs(x-pathX(y))<1.6 || (isGlade(x,y) && distance(x,y,29,29)>3.4 && hash(x,y,9)>.78);}
function isWater(x,y){return x<10+2*Math.sin(y*.25) && x>7+2*Math.sin(y*.25);}
const specials=[
  {kind:'chest',x:28.5,y:27.3,id:'chest'},
  {kind:'sign',x:27,y:31,id:'sign'},
  {kind:'fire',x:26.9,y:26.5,id:'fire'},
  {kind:'rock',x:34,y:27.5,id:'rock'},
  {kind:'dummy',x:30.3,y:30.3,id:'training-dummy'},
];

export function createWorld(){
  const ground=[]; const objects=[];const obstacles=new Set();
  for(let y=0;y<MAP_SIZE;y++){
    const row=[];
    for(let x=0;x<MAP_SIZE;x++){
      const water=isWater(x,y) && !isGlade(x,y);
      const path=isPath(x,y);
      const tile={x,y,kind: water?'water':path?'path':'grass',variant:Math.floor(hash(x,y,1)*3)};
      if(isGlade(x,y)&&distance(x,y,29,29)<3) tile.kind='grass';
      row.push(tile);
      const r=hash(x,y,4), near=distance(x,y,29,29);
      const valid=!path&&near>7.2&&!water&&x>1&&y>1&&x<MAP_SIZE-2&&y<MAP_SIZE-2;
      if(water){ obstacles.add(`${x},${y}`);continue;}
      if(valid && r<.10){
        objects.push({kind:hash(x,y,17)<.28?'pine':'tree',x:x+.5,y:y+.5,variant:Math.floor(hash(x,y,15)*3)});
        obstacles.add(`${x},${y}`);
      }else if(valid&&r<.123){
        objects.push({kind:'rock',x:x+.5,y:y+.5,variant:0});obstacles.add(`${x},${y}`);
      }else if(r<.16 && !path && near>2){objects.push({kind:'shrub',x:x+.5,y:y+.5,variant:Math.floor(hash(x,y,7)*2)});}
      else if(r<.21&&!water){objects.push({kind:'flower',x:x+.5,y:y+.5,variant:Math.floor(hash(x,y,7)*2)});}
      else if(r<.218&&valid){objects.push({kind:'log',x:x+.5,y:y+.5,variant:0});}
    }
    ground.push(row);
  }
  for(const item of specials) objects.push({...item,variant:0});
  // Low stonework beside the fire suggests an old campsite.
  for(let i=0;i<3;i++){
    let a=i*Math.PI*2/3;
    objects.push({kind:'rock',x:26.9+Math.cos(a)*.95,y:26.5+Math.sin(a)*.95,variant:0});
  }
  objects.sort((a,b)=>a.x+a.y-b.x-b.y);
  const dummy=specials.find(item=>item.kind==='dummy');
  const collides=(x,y,radius=0)=>{
    if(x-radius<.4||y-radius<.4||x+radius>MAP_SIZE-.4||y+radius>MAP_SIZE-.4)return true;
    // Terrain tiles and trees have tile-sized footprints; test the player's radius against them.
    for(let cy=Math.floor(y-radius);cy<=Math.floor(y+radius);cy++){
      for(let cx=Math.floor(x-radius);cx<=Math.floor(x+radius);cx++){
        if(obstacles.has(`${cx},${cy}`))return true;
      }
    }
    return Math.hypot(x-dummy.x,y-dummy.y) < .43+radius;
  };
  return {ground,objects,obstacles,collides,specials,dummy};
}

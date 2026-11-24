// Eight key poses, expressed relative to the hip, knee and ankle.
// Each leg alternates a planted stride with a shorter, lifted return.
const walkCycle=[
  [0,0,0,0], [1,3,0,0], [2,5,0,0], [1,3,0,-1],
  [0,0,0,-2], [-2,-3,-1,-3], [-3,-5,-1,-2], [-2,-3,0,-1]
];
const limbCache=new WeakMap();
function splitLimbs(rest){
  if(limbCache.has(rest))return limbCache.get(rest);
  const base=rest.getContext('2d').getImageData(0,0,40,64);
  const upper=pixelPaper(40,64),front=pixelPaper(40,64),back=pixelPaper(40,64);
  const near=front.getContext('2d').createImageData(40,64),far=back.getContext('2d').createImageData(40,64);
  for(let y=30;y<47;y++){
    const leftEdge=y<34?13:14,rightEdge=y<36?31:30;
    for(let x=0;x<40;x++){
      const layer=x<leftEdge?near:x>=rightEdge?far:null;
      if(!layer)continue;
      const offset=(y*40+x)*4;if(!base.data[offset+3])continue;
      layer.data.set(base.data.subarray(offset,offset+4),offset);
      // Continue the visible torso under the shoulder for its range of movement.
      const nearest=x<leftEdge?leftEdge:rightEdge-1;
      if(Math.abs(x-nearest)<=3 && y<44){
        const src=(y*40+nearest)*4;base.data.copyWithin(offset,src,src+4);
      }else base.data[offset+3]=0;
    }
  }
  upper.getContext('2d').putImageData(base,0,0);front.getContext('2d').putImageData(near,0,0);back.getContext('2d').putImageData(far,0,0);
  const result={upper,front,back};limbCache.set(rest,result);return result;
}
function walkFrame(rest,phase,arm,lean){
  if(phase<0&&!arm&&!lean)return rest;
  const output=pixelPaper(40,64),c=output.getContext('2d');
  c.imageSmoothingEnabled=false;
  const bob=phase<0?0:[0,-1,-1,0,0,-1,-1,0][phase];
  const limbs=splitLimbs(rest);
  function strip(sx,y,w,dx,dy,layer=limbs.upper){c.drawImage(layer,sx,y,w,1,sx+dx,y+dy,w,1);}
  // Separate feet and keep every row connected while bending the knees.
  for(const rear of [true,false]){
    const x=rear?20:0,w=20;
    const pose=phase<0?[0,0,0,0]:walkCycle[(phase+(rear?4:0))%8];
    let last=43+bob;
    for(let y=44;y<64;y++){
      const knee=Math.min(1,(y-44)/9),ankle=Math.min(1,Math.max(0,(y-53)/7));
      const dx=Math.round(pose[0]*knee+(pose[1]-pose[0])*ankle);
      const dy=Math.round(bob*(1-knee)+pose[2]*knee+(pose[3]-pose[2])*ankle);
      const dst=y+dy;for(let row=last+1;row<dst;row++)strip(x,y,w,dx,row-y);
      strip(x,y,w,dx,dy);last=dst;
    }
  }
  const swing=phase<0?0:[0,-1,-3,-2,0,2,3,1][phase];
  function swingArm(layer,amount,lift){
    let previous=29+bob;
    for(let y=30;y<47;y++){
      const t=Math.min(1,(y-30)/12),dx=Math.round(amount*t),dy=bob-Math.round(lift*t),dest=y+dy;
      for(let row=previous+1;row<dest;row++)strip(0,y,40,dx,row-y,layer);
      strip(0,y,40,dx,dy,layer);previous=dest;
    }
  }
  swingArm(limbs.back,arm*2-swing*.6,arm);
  for(let y=0;y<44;y++)strip(0,y,40,Math.round(lean*(1-Math.min(1,y/39))),bob);
  swingArm(limbs.front,swing,Math.abs(swing)*.35);
  return output;
}

// Wearables are drafted directly on each apprentice's 40 × 64 pixel mannequin.
function tailor(c,a){
  const female=a.gender==='Mulher';
  function palette(hex) {
    const rgb=[1,3,5].map(n=>parseInt(hex.slice(n,n+2),16));
    return [-.68,-.36,0,.28,.55].map(v=>'rgb('+rgb.map(n=>Math.round(v<0?n*(1+v):n+(255-n)*v))+')');
  }
  const hair=palette(a.hair),shirt=palette(a.cloth),leg=palette(a.leg);
  function rect(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  // Fill horizontal runs at pixel centers so diagonal fabric and hair edges stay crisp.
  function poly(points,color){
    for(let y=Math.min(...points.map(p=>p[1]));y<Math.max(...points.map(p=>p[1]));y++){
      const hits=[];for(let i=0;i<points.length;i++){let [x1,y1]=points[i],[x2,y2]=points[(i+1)%points.length];
        if((y1<=y+.5&&y2>y+.5)||(y2<=y+.5&&y1>y+.5))hits.push(x1+(y+.5-y1)*(x2-x1)/(y2-y1));}
      hits.sort((u,v)=>u-v);for(let i=0;i+1<hits.length;i+=2){let x=Math.ceil(hits[i]-.5);rect(x,y,Math.ceil(hits[i+1]-.5)-x,1,color);}
    }
  }
  // Each profile specifies the crown height and the cut at the temple and nape.
  const cuts=[
    [5,11,13,19],[2,9,14,22],[2,9,16,29],[0,10,12,18],[8,13,12,18],
    [4,12,12,18],[0,12,12,21],[3,10,16,21],[0,6,14,23],[3,11,13,20],
    [3,10,13,28],[3,10,15,20],[2,8,14,26],[3,9,15,25],[4,11,12,20],
    [0,9,14,20],[6,12,12,18],[4,10,14,25],[3,10,14,26],[2,12,13,18]
  ];
  function haircut(i){
    let [y,left,fringe,nape]=cuts[i]; if(female){left--;fringe++;if([2,5,11,12,17,18].includes(i))nape+=3;}
    let crown=[[left,12],[left+2,y+4],[left+6,y+1],[21,y],[27,y+1],[30,y+3],[32,y+6],[33,fringe-1],[29,fringe],[26,fringe-2],[23,fringe+1],[20,fringe+3],[18,19],[16,19],[15,nape],[left+1,nape-2],[left,18]];
    poly(crown,hair[0]);poly([[left+1,12],[left+4,y+4],[20,y+1],[26,y+2],[30,y+5],[31,fringe-2],[25,fringe-4],[19,fringe+1],[16,17],[14,nape-3],[left+2,nape-4]],hair[2]);
    const locks=i===4||i===16?2:i===1||i===8||i===13?7:4;
    for(let k=0;k<locks;k++){let x=left+2+k*(i===8?3:2),h=y+4+(k%3);
      poly([[x,h+4],[x+2,h],[x+5,h-1],[x+3,h+1],[x+1,h+5]],hair[k%2?1:3]);}
    if([3,6,15].includes(i))for(let k=0;k<(i===3?1:3);k++){let x=16+4*k;poly([[x-3,y+7],[x-2,y],[x+4,y+3],[x+6,y+8]],hair[k%2?1:2]);}
    if([1,8,13].includes(i))for(let k=0;k<5;k++){let x=left+k*4,h=y+2+Math.abs(2-k);rect(x,h+1,5,3,hair[1]);rect(x+1,h,3,2,hair[3]);}
    if([9,17,18].includes(i)){const high=i===9,cy=high?5:18;poly([[left+3,cy-3],[left-1,cy-5],[left-5,cy-3],[left-6,cy+2],[left-3,cy+5],[left+3,cy+4]],hair[0]);rect(left-4,cy-2,5,5,hair[2]);rect(left-3,cy-3,3,2,hair[3]);if(!high)for(let k=0;k<6;k++){let x=left-4+(i===18?k%2:0);rect(x,cy+3+k*2,5-Math.floor(k/3),2,hair[k%2?1:2]);}}
    // Layer small, stepped locks over the crown, following the parting.
    for(let k=0;k<(i===4||i===16?3:5);k++){
      const x=left+3+k*3,top=y+3+Math.abs(k-2);
      rect(x,top+1,2,1,hair[3]);rect(x+1,top,2,1,hair[k===2?4:3]);
      if(i!==4&&i!==16)rect(x-1,top+3,1,2,hair[1]);
    }
    if(female&&[0,3,5,7,10,11,12,14,18].includes(i)){
      poly([[20,fringe-3],[23,fringe-3],[21,fringe+3],[18,fringe+6],[19,fringe+2]],hair[1]);
      rect(20,fringe-1,1,3,hair[3]);
    }
    if(i===14||i===19)poly([[20,y+2],[24,y+2],[19,y+5],[16,y+8]],hair[4]);
  }
  function trousers(i){
    const short=[1,10,16].includes(i),wide=[2,6,7,9,15,19].includes(i),bottom=short?50:58;
    const hip=female?13:14,far=female?23:24;
    for(const [x,foot,p] of [[far,far,1],[hip,hip-2,2]]){
      const w=wide?9:7;
      poly([[x-1,40],[x+w,40],[x+w,47],[foot+w,bottom],[foot-1,bottom],[foot-1,51],[x-2,47]],leg[0]);
      poly([[x,41],[x+w-1,41],[x+w-2,48],[foot+w-1,bottom-1],[foot+1,bottom-1],[foot,50]],leg[p]);
      rect(x+1,44,2,short?3:7,leg[3]);rect(foot+1,bottom-3,w-2,2,leg[i===4||short?3:1]);
    }
    for(const x of [hip,far]){
      const end=short?49:55;
      poly([[x+1,46],[x+5,47],[x+4,49],[x+2,48]],leg[1]);
      rect(x+2,end-2,3,1,leg[3]);rect(x+1,end-1,2,1,leg[1]);
    }
    rect(hip-1,38,far-hip+8,5,leg[1]);rect(hip,39,far-hip+5,1,leg[3]);
    if(female&&i===9){poly([[13,40],[28,40],[31,51],[9,51]],leg[1]);for(let x=13;x<=26;x+=4)rect(x,43,2,7,leg[3]);}
    if([2,7,11,13,14,17,18].includes(i)){rect(hip-1,45,6,4,leg[1]);rect(hip-1,45,6,1,leg[4]);}
    if([5,8,12,16,19].includes(i))rect(hip,43,1,bottom-5-43,leg[4]);
    if([3,9,10,15].includes(i))for(let y=45;y<bottom-2;y+=3)rect(hip,y,5,1,leg[1]);
  }
  function blouse(i){
    const left=female?14:13,right=female?28:29,front=left-5;
    const vest=[2,7,8,18].includes(i),coat=[4,5,10,12,14,15,19].includes(i);
    const hem=coat?([12,15,19].includes(i)?43:40):37;
    // The near sleeve follows the shoulder down to the original wrist.
    for(const near of [false,true]){
      const x=near?front:right-2,w=near?7:5,end=vest?29:coat?40:33;
      poly([[x+3,25],[x+w,26],[x+w,32],[x+w-1,end],[x-1,end],[x,30]],shirt[0]);
      poly([[x+3,26],[x+w-1,27],[x+w-2,end-1],[x,end-1],[x+1,30]],shirt[near?2:1]);
      rect(x+1,end-3,w-2,1,shirt[3]);
    }
    poly([[left+3,24],[right-4,24],[right,27],[right-1,33],[right+(coat?2:0),hem],[left-(coat?2:0),hem],[left,32],[left-2,28]],shirt[0]);
    poly([[left+3,25],[right-4,25],[right-1,28],[right-2,33],[right+(coat?0:-1),hem-2],[left,hem-2],[left+1,32],[left,28]],shirt[2]);
    rect(left+1,30,2,hem-32,shirt[1]);rect(left+2,hem-3,right-left-4,1,shirt[3]);
    rect(left+3,27,4,1,shirt[3]);rect(left+2,28,2,1,shirt[3]);
    poly([[left+3,hem-7],[left+7,hem-6],[left+9,hem-7],[left+6,hem-5]],shirt[1]);
    const mid=right-5;
    if(female&&[3,9,15,19].includes(i)){poly([[mid-6,25],[mid-2,26],[mid+1,24],[mid,28],[mid-2,27],[mid-5,29]],shirt[3]);}

    if(vest||[3,4,10,11,14,15,17].includes(i)){poly([[mid-4,25],[mid+3,25],[mid,30]],shirt[0]);rect(mid,29,1,hem-30,shirt[1]);for(let y=30;y<hem-2;y+=3)rect(mid+1,y,1,1,'#cfad74');}
    if([1,6,9,13,16].includes(i))for(let y=29;y<hem-2;y+=i===6?4:3){rect(left+2,y,right-left-4,1,shirt[3]);if(i===6||i===9)for(let x=left+3;x<right-2;x+=4)rect(x+(i===9?(y%2):0),y-1,1,3,shirt[1]);}
    if(i===5||i===12||i===19)poly([[left-2,25],[left+2,23],[mid+1,25],[mid,29],[left,28],[left-3,31]],shirt[1]);
    if(i===7){rect(left+2,25,2,9,shirt[3]);rect(right-4,25,2,8,shirt[3]);rect(left+3,32,8,4,shirt[1]);}
    if(i===18)poly([[right-4,25],[right-1,26],[left+2,36],[left,35]],'#936943');
  }
  function gear(i){
    const neck=female?21:22,ny=24,ear=female?17:18,ey=female?16:17;
    if(i===6){
      const p=palette('#387687');poly([[ear-6,ey],[ear-7,9],[ear-4,5],[ear,3],[ear+5,3],[ear+8,6],[ear+5,5],[ear,5],[ear-3,7],[ear-4,10],[ear-3,ey]],p[0]);
      rect(ear-5,8,2,6,p[3]);rect(ear-4,ey-3,6,7,p[0]);rect(ear-3,ey-2,4,5,p[2]);rect(ear-2,ey-1,2,3,p[4]);return;
    }
    const p=palette(i===11?'#a4454e':i===2?'#aa6040':'#346f7b');
    poly([[neck-7,ny-1],[neck-2,ny+1],[neck+5,ny-1],[neck+6,ny+1],[neck,ny+4],[neck-6,ny+2]],p[0]);
    poly([[neck-6,ny],[neck-2,ny+2],[neck+5,ny],[neck,ny+3]],p[3]);
    if(i===11){poly([[neck,27],[neck+3,26],[neck+2,29],[neck+4,34],[neck+2,37],[neck,35],[neck+1,30]],p[0]);rect(neck+1,27,2,2,p[3]);rect(neck+2,31,1,4,p[2]);}
    if(i===2){poly([[neck-4,26],[neck+4,26],[neck,32]],p[1]);poly([[neck-3,26],[neck+3,26],[neck,30]],p[2]);}
    if(i===17){poly([[neck-5,26],[neck,27],[neck-1,32],[neck,39],[neck-5,40],[neck-6,33]],p[0]);rect(neck-4,28,3,10,p[2]);rect(neck-4,35,3,1,p[4]);rect(neck-4,39,1,2,p[1]);rect(neck-2,39,1,2,p[1]);}
  }
  return {haircut,trousers,blouse,gear};
}

// Equipment is drawn in the same 40 × 64 coordinate space as the costume atlas.
function drawEquipment(c,index,a,kit,behind){
  if(index<0)return;
  const female=a.gender==='Mulher';
  const eyes=[[27,17],[26,17],[26,19],[29,15],[29,17],[27,16]];
  const anchor=eyes[kit];
  const ink='#261f27',brass='#c49442',glint='#f6dc8c',leather='#83523a',teal='#48726a',red='#ad5050';
  function rect(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function path(coords,color,width=1){
    for(let n=2;n<coords.length;n+=2){
      const x=coords[n-2],y=coords[n-1],dx=coords[n]-x,dy=coords[n+1]-y,len=Math.max(Math.abs(dx),Math.abs(dy),1);
      for(let i=0;i<=len;i++)rect(Math.round(x+dx*i/len),Math.round(y+dy*i/len),width,width,color);
    }
  }
  function hat(x,y,w,h,color){
    rect(x+3,y,w-6,h,ink);rect(x+1,y+2,w-2,h-1,ink);
    rect(x+3,y+2,w-6,h-2,color);rect(x+4,y+2,5,1,glint);
  }
  function flower(x,y){rect(x+1,y,2,5,red);rect(x,y+1,5,2,'#dd7972');rect(x+2,y+2,1,1,glint);}
  c.save();
  if(behind){
    if(index===12){hat(3,27,12,14,leather);rect(5,32,5,6,'#a57348');rect(7,33,2,2,brass);}
    if(index===17){path([18,24,13,29,9,32,5,30],ink,4);path([18,25,14,29,10,32,5,30],teal,2);}
    c.restore();return;
  }
  const isHead=[0,1,4,5,6,7,8,9,13,14,15,16].includes(index)||female&&[3,18].includes(index);
  if(isHead)c.translate(anchor[0]-27,anchor[1]-17);
  switch(index){
    case 0:hat(8,2,23,9,teal);rect(21,10,12,2,ink);rect(23,10,9,1,brass);break;
    case 1:path([18,16,24,16,25,15,30,15,30,18,29,19,26,19,25,18,25,16],ink);rect(26,16,2,1,'#a9d1d3');break;
    case 2:case 17:path([16,23,20,25,26,24],ink,3);path([17,24,20,25,26,24],index===2?a.cloth:teal,2);break;
    case 3:flower(female?12:24,female?11:27);break;
    case 4:hat(6,2,25,8,female?'#925265':'#47597a');rect(10,10,19,2,ink);break;
    case 5:hat(10,0,18,9,'#c99d53');rect(5,9,29,3,'#835b33');rect(6,9,27,1,glint);rect(12,7,14,2,leather);break;
    case 6:path([14,17,13,11,16,6,21,4,26,6,28,10],ink,2);hat(13,14,8,7,teal);rect(16,16,2,4,brass);break;
    case 7:path([17,18,25,21,30,19,30,21,26,23,23,23,20,21],teal,2);break;
    case 8:path([25,15,29,15,30,16,30,18,29,19,25,19,24,18,24,16,25,15],brass);path([24,18,22,21,21,21],brass);break;
    case 9:path([18,19,17,20,18,22,20,22,20,20],brass);if(female)rect(18,22,2,2,'#78c9c2');break;
    case 10:path([17,25,21,30,25,25],brass);rect(20,30,3,3,glint);rect(21,31,1,1,leather);break;
    case 11:path([21,25,24,25,22,28,23,32,21,33],red,2);break;
    case 12:path([18,25,16,29,15,35],leather,2);rect(15,30,3,1,brass);break;
    case 13:path([7,11,16,9,26,9,30,11],red,2);path([8,11,5,14,4,14],red,2);break;
    case 14:path([8,6,12,10,16,5,20,9,25,4,27,9,30,6,29,11,10,12],brass,2);rect(18,10,3,2,glint);break;
    case 15:hat(10,0,18,10,'#454157');rect(6,10,27,2,ink);rect(12,8,14,2,brass);break;
    case 16:path([9,11,21,10,29,11,33,12],teal,2);rect(25,12,8,1,glint);break;
    case 18:{const x=female?13:21,y=female?12:26;rect(x-3,y,3,4,red);rect(x+2,y,3,4,red);rect(x,y+1,2,2,brass);break;}
    case 19:if(female)path([24,24,20,30,15,37],leather,2);hat(13,36,8,6,leather);rect(16,39,2,1,brass);break;
  }
  c.restore();
}

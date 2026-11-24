const trailTalks=[
  'Quando eu era pequeno, o sino servia para chamar os barqueiros. A quarta nota nunca fazia parte da canção.',
  'Já viu para onde os girassóis viram? Depois que a ponte caiu, alguns olham para a água.',
  'O Verity me ensinou este caminho. Se ele ainda ouve o sino, ainda pode nos ouvir.',
  'Eu trouxe um punhado de sementes. Em cada margem segura, deixo uma para quem vier depois.',
  'A Lia ficou para trás de propósito. Enquanto ela segura a comporta, o reflexo não consegue atravessar.',
  'Na ponte, eu vi a sombra mexer antes da mão. Acho que o fio puxa dos dois lados.',
  'Quando paramos para ouvir o rio, dá para distinguir a corrente do sussurro dos portais.'
];
let trail=null,talkCursor=0;
function sayTrail(line){
  if(!trail)return;
  trail.line=line;trail.until=levelTime+340;trail.last=levelTime;
  speakLine('Guia',line);
}
function greetTrail(){
  trail={x:player.x-14,y:player.y+player.h,face:1,phase:0,history:[],line:'',until:0,last:-500,away:!!level.isBoss,exit:0};
  if(level.isBoss)sayTrail('O selo só deixa passar quem carrega a semente. Eu não posso ir com você. Te espero na outra margem.');
  else if(!level.training)sayTrail(currentLevel%20===0?'Estou com você. Se quiser conversar, toque em Conversar com o guia.':level.story.clue);
  const b=document.getElementById('talkTrail');b.hidden=!!level.isBoss||!!level.training;
}
function talkTrail(){
  if(screen!=='playing'||paused||!trail||trail.away||level.training)return;
  const station=level.river?.stations[level.river.index];
  const line=station&&talkCursor%3===0?riverTasks[station.kind].hint:trailTalks[talkCursor%trailTalks.length];
  talkCursor++;sayTrail(line);
}
function stepTrail(){
  if(!trail)return;
  if(level.isBoss&&!trail.away){
    trail.away=true;trail.exit=0;
    document.getElementById('talkTrail').hidden=true;
    sayTrail('O Faísca reconhece só um aprendiz por vez. Vou esperar aqui. Você já sabe desviar!');
  }
  if(trail.away){trail.exit++;trail.x-=1.25;return;}
  const heroX=player.x+player.w/2,heroY=player.y+player.h;
  trail.history.push([heroX,heroY,player.facing,player.grounded]);if(trail.history.length>29)trail.history.shift();
  const target=trail.history[0],dx=target[0]-trail.x;
  if(Math.abs(dx)>12){const move=Math.sign(dx)*Math.min(4.4,(Math.abs(dx)-10)*.20);trail.x+=move;trail.face=Math.sign(move);trail.phase+=Math.abs(move)*.13;}
  else trail.phase=0;
  trail.y+=(target[1]-trail.y)*.23;
  if(!level.training&&levelTime-trail.last>850)talkTrail();
}
function drawTrail(){
  if(!trail||trail.away&&trail.exit>100)return;
  ctx.save();if(trail.away)ctx.globalAlpha=Math.max(0,1-trail.exit/100);
  drawCast(ctx,'guide',trail.x,trail.y,trail.face,.98,trail.phase,0);
  ctx.restore();
}
function drawTrailSpeech(){
  if(!trail?.line||levelTime>trail.until||screen!=='playing'||enterDoorTimer)return;
  const c=ctx;c.save();c.font='bold 12px monospace';
  const words=trail.line.split(' '),lines=[''];
  for(const word of words){const n=lines.length-1,next=(lines[n]+' '+word).trim();if(c.measureText(next).width>525)lines.push(word);else lines[n]=next;}
  const width=Math.min(558,Math.max(...lines.map(t=>c.measureText(t).width))+25),x=(800-width)/2,y=level.isBoss?365:369;
  c.fillStyle='#222633';c.fillRect(x,y,width,22+lines.length*14);c.fillStyle='#ed994e';c.fillRect(x,y,3,22+lines.length*14);
  c.textAlign='left';c.fillText('GUIA',x+10,y+13);c.fillStyle='#fff1d2';lines.forEach((t,i)=>c.fillText(t,x+10,y+28+i*14));c.restore();
}

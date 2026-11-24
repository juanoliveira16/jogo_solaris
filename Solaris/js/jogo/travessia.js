// Stations carry their own state. A chapter revisits the same river after the next breach.
const riverChapters=[
  ['Canais do Pátio','#5ac3bb','#1b535c'],['Oficinas da Ponte','#efab68','#774940'],
  ['Faróis de Vidro','#aab6ff','#484776'],['Aqueduto de Geada','#98dbe7','#365c72'],
  ['Avesso do Sino','#db9bc4','#624464']
];
const riverTasks=[
  {name:'O leito seco',icon:'gota',hint:'Fique na bomba até a água alcançar a raiz.',lore:'A água não sumiu. A mão fechou a passagem debaixo da ponte.',done:'Ouvi a água voltar. A raiz lá na frente vai sobreviver.'},
  {name:'Cartas da margem',icon:'carta',hint:'Leve a carta da bolsa até a caixa azul.',lore:'Lia escreve em papel encerado. Mesmo se o canal subir, a mensagem chega.',done:'A caixa respondeu! Ainda tem gente do outro lado.'},
  {name:'O fio no vento',icon:'fio',hint:'Salte o fio quando ele raspar o chão.',lore:'Viu o pólen preso no ar? É assim que a gente enxerga o fio.',done:'O fio se soltou. Agora ele não consegue puxar essa margem.'},
  {name:'A resposta de Lia',icon:'sino',hint:'Pouse no sino. Espere o eco dourado e pule outra vez.',lore:'Lia sempre espera o eco. A mão do outro lado toca depressa demais.',done:'Escutou a resposta? Essa última nota veio do Pátio.'},
  {name:'Luz de vigia',icon:'luz',hint:'Entre no feixe. Faça sua sombra cobrir o olho violeta.',lore:'O vigia enxerga pelo cristal. Sua sombra esconde a vila dele.',done:'O olho fechou. As janelas da vila acenderam de novo.'},
  {name:'Sementes à deriva',icon:'semente',hint:'Pegue a semente que desce e plante no vaso.',lore:'Lembra do último saco na ponte? O vento ainda carrega as sementes.',done:'Essa flor vai marcar o caminho de volta.'},
  {name:'O nó do portal',icon:'no',hint:'Atravesse o nó violeta com o impulso no ar.',lore:'Quando o fio fica frouxo, ele perde força. Rompa o nó pelo meio.',done:'A costura abriu. Dá para ver nossa margem pela fresta.'}
];
const scriptsOfRiver=[[0],[1],[2],[3],[4],[5],[6],[1,0],[4,2],[5,3],[0,6],[2,1],[3,4],[6,5],[4,1],[5,0],[2,3],[1,6],[3,6]];
function riverPlatform(x,y,w,oneWay=false){return {x,y,w,h:oneWay?12:450-y,type:'solid',oneWay};}
function buildRiver(l,idx){
  const chapter=Math.floor(idx/20),region=riverChapters[chapter%5];
  l.expedition={goal:-1,done:false,tiles:l.platforms,marks:[],trap:-1};
  l.story={region:region[0],clue:'',until:0};
  if(l.isBoss){
    const layouts=[[[78,252,140],[286,216,154],[505,251,164]],[[45,247,118],[223,218,108],[492,248,120],[657,210,100]],[[110,254,104],[285,222,110],[460,222,110],[640,254,98]]];
    l.platforms=[riverPlatform(0,300,800),...layouts[chapter%3].map(t=>riverPlatform(...t,true))];
    l.expedition.tiles=l.platforms;l.arena={region,chapter};l.story.clue='As varandas deixam o centro livre para desviar.';
    return;
  }
  const mirrored=(idx+chapter)%4===3,offset=((idx*17)%25)-12;
  const world=x=>mirrored?800-x:x;

  l.spawn={x:world(42)-10,y:278};l.door={x:world(759)-14,y:265,w:28,h:45,open:false};
  const sequence=scriptsOfRiver[idx%20],stations=sequence.map((id,j)=>{
    const kind=(id+chapter)%riverTasks.length,centre=sequence.length===1?395+offset:(j?558:222)+offset;
    return {kind,x:world(centre),end:world(centre+115),dir:mirrored?-1:1,hold:0,stage:0,timer:0,warning:0};
  });
  // Cut canal channels only where there is space to land on either side of a station.
  const forbidden=[l.spawn.x,l.door.x,...stations.flatMap(s=>[s.x,s.end,s.x+42*s.dir])];
  if(l.levelChest)forbidden.push(world(645));
  const width=({easy:28,medium:36,hard:44,impossible:50})[currentDifficulty]||36;
  const channels=[world(157+offset),world(468-offset),world(667-offset)].filter(x=>forbidden.every(t=>Math.abs(t-x)>width/2+31)).sort((a,b)=>a-b);
  l.platforms=[];let edge=0;
  for(const x of channels){l.platforms.push(riverPlatform(edge,310,x-width/2-edge));edge=x+width/2;}
  l.platforms.push(riverPlatform(edge,310,800-edge));
  // Footbridges guide aerial objectives; do not place platforms above grounded switches.
  for(const s of stations)if(s.kind===5||s.kind===6)l.platforms.push(riverPlatform(s.x-s.dir*72-29,269,58,true));
  l.expedition.tiles=l.platforms;
  l.river={stations,index:0};l.name='FASE '+(idx+1)+' · '+stations.map(s=>riverTasks[s.kind].name).join(' / ');
  l.story.clue=riverTasks[stations[0].kind].lore;
  if(l.levelChest)Object.assign(l.levelChest,{x:world(645)-14,y:288});
}
function riverHint(){
  if(level.arena)return level.door.open?'O selo caiu. Entre no portal.':'Derrote o chefe. Use as varandas para mudar de altura.';
  const r=level.river,s=r.stations[r.index];if(!s)return 'O caminho está livre. Entre no portal dourado.';
  return (r.stations.length>1?(r.index+1)+'/'+r.stations.length+' · ':'')+riverTasks[s.kind].hint;
}
function finishStation(s){
  const r=level.river;if(r.stations[r.index]!==s)return;
  r.index++;addShockwave(s.x,276,'#ffcf63');sfxKey();
  sayTrail(riverTasks[s.kind].done);
  level.expedition.done=r.index===r.stations.length;level.door.open=level.expedition.done;
  if(!level.door.open)level.story.clue=riverTasks[r.stations[r.index].kind].lore;
}
function updateRiver(){
  if(level.arena){level.expedition.done=level.boss.hp<=0;level.door.open=level.expedition.done;return;}
  const r=level.river,s=r.stations[r.index];if(!s)return;
  const x=player.x+player.w/2,feet=player.y+player.h,near=Math.abs(x-s.x)<24,low=feet>284;
  s.timer++;if(s.warning>0)s.warning--;
  switch(s.kind){
    case 0:if(near&&player.grounded&&low)s.hold++;if(s.hold>=60)finishStation(s);break;
    case 1:if(!s.stage&&near&&low){s.stage=1;sfxKey();}if(s.stage&&Math.abs(x-s.end)<25&&low)finishStation(s);break;
    case 2:{
      const delta=(x-s.x)*s.dir;
      if(delta< -12)s.stage=1;
      if(s.stage===1&&Math.abs(delta)<22&&!player.grounded&&feet<286)s.stage=2;
      if(delta>18&&s.stage===2)finishStation(s);
      else if(Math.abs(delta)<9&&low&&!s.warning){player.x=s.x-s.dir*45-player.w/2;player.vx=0;s.warning=40;s.stage=1;}
      break;}
    case 3:
      if(!s.stage&&near&&low&&player.grounded){s.stage=1;s.timer=0;sfxKey();}
      if(s.stage&&s.timer>=65&&near&&!player.grounded&&player.vy<0)finishStation(s);
      break;
    case 4:{
      const shadow=s.x+42*s.dir,aligned=Math.abs(x-shadow)<16&&low;
      s.hold=aligned?Math.min(45,s.hold+1):Math.max(0,s.hold-1);if(s.hold>=45)finishStation(s);break;}
    case 5:{
      const m=fallingSeed(s);if(!s.stage&&Math.hypot(x-m.x,feet-16-m.y)<31){s.stage=1;sfxKey();}
      if(s.stage&&Math.abs(x-s.end)<26&&low)finishStation(s);break;}
    case 6:if(Math.abs(x-s.x)<38&&Math.abs(feet-16-258)<34&&(player.dashFrames>0||!player.grounded&&Math.abs(player.vx)>4.8))finishStation(s);break;
  }
}
function fallingSeed(s){const t=(s.timer%165)/165;return {x:s.x+Math.sin(t*5)*22,y:210+t*90};}
function paintRiver(){
  const r=level.river;if(!r)return;
  const c=ctx;c.save();c.font='bold 12px monospace';c.textAlign='center';
  const block=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
  const disk=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
  const gold='#ffda77',aqua='#6be0cd',violet='#ce8fdf';
  const banks=level.platforms.filter(p=>!p.oneWay);
  for(let n=1;n<banks.length;n++){
    const left=banks[n-1].x+banks[n-1].w,right=banks[n].x;
    block(left,346,right-left,104,'#294c5b');
    for(let x=left+2;x<right-4;x+=8)block(x,345+2*Math.sin(x*.18+levelTime*.045),5,2,'#74b9bc');
  }

  r.stations.forEach((s,i)=>{
    if(i>r.index)return;const x=s.x,y=309,done=i<r.index,active=done?aqua:gold;
    if(!done){c.fillStyle=gold;c.fillText('▼',x,221+Math.sin(levelTime*.06)*2);}
    switch(s.kind){
      case 0:block(x-15,y-12,30,12,'#5d5961');block(x-7,y-33,11,25,'#729593');block(x-12,y-36,27,5,active);block(x+8,y-21,13,5,aqua);block(x-13,y-7,Math.min(26,s.hold*.45),4,aqua);
        block(Math.min(x,x+55*s.dir),y-2,Math.round(55*Math.min(1,s.hold/60)),2,aqua);
        block(x+55*s.dir,y-8-s.hold*.16,3,8+s.hold*.16,'#73945e');if(done)disk(x+55*s.dir,y-20,6,gold);break;
      case 1:block(x-12,y-19,23,18,'#965e40');if(!s.stage){block(x-8,y-25,16,10,'#fff1bd');block(x-1,y-22,3,3,'#b94d58');}block(s.end-9,y-27,21,18,'#507a9d');block(s.end-4,y-23,12,3,'#252f49');block(s.end,y-9,4,9,'#84724a');break;
      case 2:for(const d of [-15,15])block(x+d,y-27,4,27,'#775774');if(!done){c.strokeStyle=s.warning?'#ff806e':violet;c.beginPath();c.moveTo(x-13,y-20);c.quadraticCurveTo(x,y-7+Math.sin(levelTime*.08)*3,x+16,y-20);c.stroke();}break;
      case 3:block(x-13,y-8,26,7,'#8e7059');disk(x,y-12,8,active);if(s.stage){c.strokeStyle=s.timer>=65?aqua:gold;c.beginPath();c.arc(x,y-12,12+(s.timer%60)*.38,0,Math.PI*2);c.stroke();}break;
      case 4:{const t=x+42*s.dir;block(x-5,y-32,10,32,'#607880');block(Math.min(x,t),y-21,43,3,aqua);block(t-14,y-5,28,4,active);disk(x+85*s.dir,y-20,9,violet);disk(x+85*s.dir,y-20,Math.max(1,5-s.hold/10),'#38253c');break;}
      case 5:{const m=fallingSeed(s);if(!s.stage)disk(m.x,m.y,5,gold);block(s.end-10,y-13,20,13,'#a95c42');if(done){block(s.end,y-31,3,19,'#51985d');disk(s.end,y-33,7,gold);}break;}
      case 6:if(!done){c.strokeStyle=violet;c.lineWidth=3;for(const d of [-6,6]){c.beginPath();c.ellipse(x+d,258,10,15,d*.06,0,Math.PI*2);c.stroke();}}break;
    }
    if(!done&&s.stage&&(s.kind===1||s.kind===5)){disk(player.x+10,player.y-10,4,gold);c.fillStyle=aqua;c.fillText('▼',s.end,271);}
  });c.restore();
}
function paintBattleHall(){
  if(!level.arena)return;
  const c=ctx,[,light,stone]=level.arena.region;c.save();
  for(let i=0;i<5;i++){
    const x=24+i*184;c.fillStyle=stone;c.fillRect(x,106,17,194);c.fillRect(x-8,98,33,10);
    c.globalAlpha=.65;c.strokeStyle=light;c.lineWidth=3;c.beginPath();c.moveTo(x+8,107);c.quadraticCurveTo(x+88,182,x+192,109);c.stroke();c.globalAlpha=1;
    c.fillStyle=light;c.fillRect(x+5,124,5,12);
  }
  c.globalAlpha=.32;c.fillStyle=stone;c.fillRect(0,285,800,15);c.restore();
}

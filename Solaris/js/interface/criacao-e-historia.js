let heroName='';
try{heroName=(gameSave.getItem('solaris_hero_name')||'').slice(0,24);}catch{}
const characterVoices={
  Lia:[1.24,1.02,0],Verity:[.77,.93,1],Guia:[.96,1.03,2],
  Herói:[1.08,1.07,3],'Voz do outro lado':[.58,.82,4]
};
let activeVoice=null;
function silenceVoice(){
  const previous=activeVoice;activeVoice=null;
  if(previous){try{window.speechSynthesis?.cancel();}catch{}}
}
function speakLine(role,text){
  silenceVoice();
  try{
  const synth=window.speechSynthesis;
  if(!soundEnabled || !synth || !window.SpeechSynthesisUtterance)return;
  const feminine=role==='Lia'||(role==='Herói' && look.gender==='Mulher');
  const [pitch,rate,index]=role==='Herói'?(feminine?[1.16,1.03,0]:[.84,1.01,0]):characterVoices[role];
  const line=new window.SpeechSynthesisUtterance(text);
  const available=synth.getVoices().filter(v=>/^pt(?:[-_]|$)/i.test(v.lang));
  available.sort((a,b)=>Number(/^pt[-_]BR/i.test(b.lang))-Number(/^pt[-_]BR/i.test(a.lang)));
  const female=/\b(female|feminina|mulher|maria|luciana|francisca|thalita|fernanda|raquel|joana|vit[oó]ria|camila|yara|ines|inês|helia|h[eé]lia|isabela|let[ií]cia)\b/i;
  const male=/\b(male|masculina?|homem|daniel|felipe|ant[oô]nio|ricardo|duarte|bruno|d[uú]arte|fabio|f[aá]bio|cristiano|donato|j[uú]lio)\b/i;
  const wanted=feminine?female:male,opposite=feminine?male:female;
  const matching=available.filter(v=>wanted.test(v.name));
  const unknown=available.filter(v=>!opposite.test(v.name));
  const pool=matching.length?matching:unknown.length?unknown:available;
  if(pool.length)line.voice=pool[index%pool.length];
  line.lang=line.voice?.lang||'pt-BR';line.pitch=pitch;line.rate=rate;
  activeVoice=line;
  line.onend=line.onerror=()=>{if(activeVoice===line)activeVoice=null;};
  synth.speak(line);
  }catch{activeVoice=null;}
}
(() => {
  const overlay=document.getElementById('opening'), art=document.getElementById('prologueArt');
  const g=art.getContext('2d'), caption=document.getElementById('openingCaption');
  g.setTransform(3,0,0,3,0,0);
  const actions=document.getElementById('openingActions'), next=document.getElementById('nextStory');
  const scenes=[
    ['Pátio do Sol',['Lia','Três badaladas! A comporta está aberta. Olha a água chegando aos girassóis!'],['Verity','Vem, {nome}! Lembra do salto que eu te ensinei? Eu te seguro do outro lado.']],
    ['A quarta badalada',['Lia','Quatro? Eu já larguei a corda. Quem tocou o sino?'],['Herói','Lia, olha o canal! Tem uma mão no reflexo. Ela está puxando a corda!']],
    ['Do outro lado',['Guia','Eu vi os dedos se abrirem. De cada fio pendia um portal. Até hoje ninguém viu o rosto de quem os segura.'],['Voz do outro lado','Atravessem, meus chefes. Derrubem as pontes. Depois, apaguem cada vila.']],
    ['A ponte das sementes',['Lia','Eles estão saindo dos portais! A ponte das sementes… o arco vai cair!'],['Herói','O rio levou o último saco. Espera… outro portal! Esse abriu aqui no Pátio.']],
    ['Verity',['Verity','{nome}… sou eu. Não pega na minha mão desta vez. Corre!'],['Herói','Verity, eu vi! Tem um fio no seu pulso. É ele que está puxando seu braço!']],
    ['A comporta',['Lia','O fio passa pelo reflexo! Vou fechar a comporta. Fica longe do braço dele!'],['Verity','Consigo mexer a mão de novo… Quando a água parou, o fio afrouxou.']],
    ['A última semente',['Lia','Sobrou uma semente na margem. Ainda tenho uma gota no cantil. Vamos, pequena…'],['Herói','O pólen grudou no fio! Agora dá para ver aonde ele vai, mesmo fora da água.']],
    ['O primeiro salto',['Lia','Eu fico com o sino, {nome}. Você conhece esse salto. Vai buscar o Verity!'],['Guia','Por aqui, {nome}! Vamos seguir o pólen juntos. Primeiro, vou te mostrar como atravessar o Pátio.']]
  ];
  const creator=document.getElementById('creator'),input=document.getElementById('heroName');
  const fields=document.getElementById('lookFields'),preview=document.getElementById('avatarPreview');
  const labels={skin:'Pele',cut:'Cabelo',outfit:'Camisa',pants:'Calças',accessory:'Acessório',body:'Corpo',eyes:'Cor dos olhos',hair:'Cor do cabelo',cloth:'Cor da camisa',leg:'Cor das calças'};
  const tones=['Porcelana','Pêssego','Dourado','Caramelo','Castanho','Ébano'];
  let naming=false,lastBeat=-1,facing=1;
  const refresh=[];
  let closeUp=false,walking=false,lastPaint=0;
  function paintPreview(time=0){
    const c=preview.getContext('2d');c.setTransform(4,0,0,4,0,0);
    const block=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
    if(!paintPanorama(c,0,144,84)){
    block(0,0,144,84,'#91cfcf');block(0,24,144,28,'#bddbba');
    block(105,9,12,12,'#ffda89');block(103,11,16,8,'#ffe6a5');
    for(let i=0;i<4;i++){const x=(i*47+time*.9)%170-15;block(x,11+i%2*8,17,2,'#e5edcc');block(x+5,9+i%2*8,8,2,'#e5edcc');}
    for(let x=0;x<144;x+=2){
      const y=34+9*Math.cos(x*.07);block(x,y,2,70-y,'#80aa96');
      const hill=49+6*Math.sin(x*.09);block(x,hill,2,70-hill,'#648b71');
    }
    block(0,62,144,22,'#859051');block(0,67,144,3,'#b6a769');
    for(let j=0;j<10;j++){const x=j*19-3;block(x,54,3,10,'#806e4b');}block(0,57,144,2,'#a38a5a');
    for(let i=0;i<16;i++){
      const x=(i*47+5)%144,y=73+i*7%10;
      block(x,y-4,1,4,'#586e3c');block(x-1,y-5,3,2,i%3?'#edcd6e':'#f2d6a0');
    }
    }
    c.save();
    if(closeUp){c.translate(72,52);c.scale(2.2,2.2);c.translate(-72,-29);}
    else block(60,75,25,2,'#637443');
    drawHero(c,72,75,1.82*facing,1.82,walking?time*8:0);
    c.restore();
  }
  function portrait(){paintPreview(lastPaint/1000);refresh.forEach(fn=>fn());}
  for(const [id,action] of [['zoomHero','zoom'],['walkHero','walk']]){
    document.getElementById(id).onclick=e=>{
      if(action==='zoom')closeUp=!closeUp;else walking=!walking;
      e.currentTarget.setAttribute('aria-pressed',String(action==='zoom'?closeUp:walking));portrait();
    };
  }
  const make=tag=>document.createElement(tag);
  const rack=document.getElementById('rackGrid'),pageSize=10;
  let rackKey=null,rackPage=0,shown='';
  function updateRack(){
    if(!rackKey)return;
    const key=rackKey,items=choicesFor(key),pages=Math.ceil(items.length/pageSize);
    rackPage=Math.min(rackPage,pages-1);
    const visible=items.slice(rackPage*pageSize,(rackPage+1)*pageSize);
    const signature=JSON.stringify([key,visible]);
    if(signature!==shown){
      shown=signature;rack.replaceChildren();
      for(const option of visible){
        const button=make('button'),tile=make('canvas'),label=make('span');
        button.type='button';button.className='rackTile';button.value=option;
        tile.width=216;tile.height=192;tile.setAttribute('aria-hidden','true');
        label.textContent=key==='skin'?(tones[items.indexOf(option)]||'Personalizada'):option;
        button.appendChild(tile);button.appendChild(label);rack.appendChild(button);
        button.onclick=()=>{look[key]=option;portrait();};
      }
    }
    for(const button of rack.children){
      const selected=button.value===look[key],canvas=button.firstElementChild,c=canvas.getContext('2d');
      button.setAttribute('aria-pressed',String(selected));
      c.setTransform(4,0,0,4,0,0);c.clearRect(0,0,54,48);c.fillStyle=selected?'#7f86b4':'#323951';c.fillRect(15,42,24,2);
      drawHero(c,27,42,facing,1,0,0,0,{...look,[key]:button.value});
    }
    document.getElementById('rackTitle').textContent=labels[key]+' · '+(key==='skin'?(tones[items.indexOf(look[key])]||'Personalizada'):look[key]);
    document.getElementById('rackPage').textContent=(rackPage+1)+' / '+pages;
    document.getElementById('rackNav').hidden=pages===1;
    document.getElementById('prevRack').disabled=rackPage===0;
    document.getElementById('nextRack').disabled=rackPage===pages-1;
  }
  function goRackPage(delta){rackPage=Math.max(0,Math.min(Math.ceil(choicesFor(rackKey).length/pageSize)-1,rackPage+delta));updateRack();}
  document.getElementById('prevRack').onclick=()=>goRackPage(-1);
  document.getElementById('nextRack').onclick=()=>goRackPage(1);
  refresh.push(updateRack);
  function toHsl(hex){
    const [r,g,b]=hex.match(/../g).map(v=>parseInt(v,16)/255),hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo,l=(hi+lo)/2;
    let h=0;if(d)h=hi===r?(g-b)/d:hi===g?(b-r)/d+2:(r-g)/d+4;
    return [Math.round((h*60+360)%360),Math.round((d?d/(1-Math.abs(2*l-1)):0)*100),Math.round(l*100)];
  }
  function toHex([h,s,l]){
    l/=100;s/=100;
    return '#'+[0,8,4].map(n=>{const k=(n+h/30)%12;const v=l-s*Math.min(l,1-l)*Math.max(-1,Math.min(k-3,9-k,1));return Math.round(255*v).toString(16).padStart(2,'0');}).join('');
  }
  const mixers=[];
  for(const k of ['eyes','hair','cloth','leg']){
    const group=make('div'),swatch=make('i');group.className='colorRow';group.dataset.key=k;group.textContent=labels[k];group.appendChild(swatch);
    let hsl;const sliders=[];
    for(const [i,part] of ['Matiz','Saturação','Luminosidade'].entries()){
      const range=make('input');range.type='range';range.min=0;range.max=i===0?359:100;
      range.setAttribute('aria-label',labels[k]+' · '+part);range.title=part;
      range.oninput=()=>{hsl[i]=Number(range.value);look[k]=toHex(hsl);portrait();};group.appendChild(range);sliders.push(range);
    }
    const sync=()=>{hsl=toHsl(look[k].slice(1));sliders.forEach((r,i)=>r.value=hsl[i]);};
    const palette=make('div');palette.className='swatches';
    for(const color of wardrobe[k]){
      const chip=make('button');chip.type='button';chip.style.backgroundColor=color;
      chip.setAttribute('aria-label',labels[k]+' '+color);chip.onclick=()=>{look[k]=color;sync();portrait();};
      refresh.push(()=>chip.setAttribute('aria-pressed',String(look[k]===color)));palette.appendChild(chip);
    }
    group.appendChild(palette);
    sync();mixers.push(sync);refresh.push(()=>{swatch.style.background=look[k];sliders[0].style.background='linear-gradient(90deg,#e33,#ed3,#3b5,#4cc,#55d,#d4b,#e33)';sliders[1].style.background='linear-gradient(90deg,#888,hsl('+hsl[0]+' 100% 50%))';sliders[2].style.background='linear-gradient(90deg,#16131a,'+look[k]+',#fff)';});
    document.getElementById('mixFields').appendChild(group);
  }
  document.getElementById('turnHero').onclick=()=>{facing*=-1;portrait();};
  const genderButtons=[document.getElementById('genderMan'),document.getElementById('genderWoman')];
  const outfitsSeen={};
  for(const radio of genderButtons){
    radio.checked=radio.value===look.gender;
    radio.onchange=()=>{
      if(!radio.checked || radio.value===look.gender)return;
      const previous=look.gender;
      outfitsSeen[previous]={...look};
      look.gender=radio.value;
      for(const key of Object.keys(stylesByGender[look.gender])){
        const list=choicesFor(key);
        const prior=outfitsSeen[previous][key],pos=stylesByGender[previous][key].indexOf(prior);
        look[key]=outfitsSeen[look.gender]?.[key] || (list.includes(prior)?prior:stylesByGender[look.gender][key][Math.max(0,pos)]);
        if(!list.includes(look[key]))look[key]=list[0];
      }
      silenceVoice();portrait();
    };
  }
  document.getElementById('randomHero').onclick=()=>{
    for(const key of Object.keys(wardrobe)){const options=choicesFor(key);look[key]=options[Math.floor(Math.random()*options.length)];}
    mixers.forEach(fn=>fn());portrait();
  };
  const costumePick=document.getElementById('costumePick');
  costumePick.onchange=()=>{if(costumePick.value!==''){equipCostume(look,Number(costumePick.value));mixers.forEach(fn=>fn());}portrait();};
  refresh.push(()=>{const i=costumes.findIndex((set,i)=>Object.keys(pieceColumn).every(k=>look[k]===uniformPiece(look.gender,k,i))&&look.cloth===set[4]&&look.leg===set[5]&&look.accessory==='Nenhum');costumePick.value=i<0?'':String(i);});
  const dock=document.getElementById('creatorDock'),modePanel=document.getElementById('campaignMode');
  const identity=document.getElementById('identityPanel'),genderPanel=document.getElementById('genderPanel');
  const modeButtons=document.getElementById('modeButtons'),info=document.getElementById('modeInfo');
  const categories=[
    ['main','Ficha'],['body','Corpo'],['cut','Cabelo'],['eyes','Olhos'],
    ['skin','Pele'],['outfit','Camisa'],['pants','Calças'],['accessory','Acessório']
  ];
  const colorFor={cut:'hair',outfit:'cloth',pants:'leg',eyes:'eyes'};
  const dockButtons=new Map();
  function selectCategory(key){
    for(const [id,button] of dockButtons)button.setAttribute('aria-pressed',String(id===key));
    identity.hidden=key!=='main' && key!=='body';
    for(const child of identity.children)child.hidden=child===genderPanel?!['main','body'].includes(key):key!=='main';
    modePanel.hidden=key!=='main';
    rackKey=['body','skin','cut','outfit','pants','accessory'].includes(key)?key:null;
    fields.hidden=!rackKey;
    if(rackKey){rackPage=Math.max(0,Math.floor(choicesFor(key).indexOf(look[key])/pageSize));updateRack();}
    const colors=document.getElementById('mixFields');
    colors.hidden=!colorFor[key];
    for(const row of colors.children)row.hidden=row.dataset.key!==colorFor[key];
  }
  for(const [i,[key,label]] of categories.entries()){
    const tab=make('button');tab.type='button';tab.title=label;
    const icon=make('i');icon.setAttribute('aria-hidden','true');icon.style.backgroundPosition=(-i*32)+'px 0';
    const text=make('span');text.textContent=label;tab.appendChild(icon);tab.appendChild(text);
    tab.onclick=()=>selectCategory(key);dockButtons.set(key,tab);dock.appendChild(tab);
  }
  function pickMode(mode){
    currentDifficulty=mode.id;
    for(const btn of modeButtons.children)btn.setAttribute('aria-pressed',String(btn.value===mode.id));
    info.textContent=mode.name+' · '+mode.normalReward+' girassóis por fase e '+mode.bossReward+' por chefe.';
  }
  for(const mode of DIFFICULTIES){
    const btn=make('button');btn.type='button';btn.value=mode.id;btn.textContent=mode.name;
    btn.style.setProperty('--mode-accent',mode.border);btn.onclick=()=>pickMode(mode);modeButtons.appendChild(btn);
  }
  selectCategory('main');pickMode(DIFFICULTIES.find(d=>d.id===currentDifficulty));
  function chooseName(){
    naming=true;creator.hidden=false;overlay.classList.add('creating');
    input.value=heroName;portrait();document.getElementById('beginStory').focus();
  }
  function beginStory(){
    if(!naming)return;
    const chosen=input.value.trim().replace(/\s+/g,' ').slice(0,24);
    if(!chosen){selectCategory('main');document.getElementById('nameError').hidden=false;input.focus();return;}
    heroName=chosen;gameSave.setItem('solaris_campaign_difficulty',currentDifficulty);
    gameSave.setItem('solaris_hero_name',heroName);gameSave.setItem('solaris_avatar_v1',JSON.stringify(look));
    naming=false;creator.hidden=true;overlay.classList.remove('creating');if(document.getElementById('skipIntro').checked){finish();return;}show(0);next.focus();
  }
  document.getElementById('beginStory').onclick=beginStory;
  function sayBeat(index){
    if(lastBeat===index)return;
    lastBeat=index;
    const [role,template]=scenes[scene][index];
    const text=template.replaceAll('{nome}',()=>heroName);
    caption.textContent=(role==='Herói'?heroName:role)+' — '+text;
    speakLine(role,text);
  }
  document.getElementById('voiceToggle').onclick=e=>{
    toggleSound();
    e.currentTarget.textContent=soundEnabled?'Vozes ligadas':'Vozes desligadas';
    e.currentTarget.setAttribute('aria-pressed',String(soundEnabled));
    if(soundEnabled){const current=lastBeat;lastBeat=-1;sayBeat(current);}
  };
  let scene=-1, alive=true, began=null;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h);}
  function flower(x,y,h,bloom,lean=0){
    for(let j=0;j<h;j++)rect(x+lean*j/h,y-j,2,2,'#55984c');
    if(h>4){rect(x-4,y-h/2,5,2,'#69b054');rect(x-5,y-h/2-2,3,2,'#9dc96b');}
    const cx=x+lean,cy=y-h;
    if(bloom>0){
      for(let i=0;i<8;i++){const a=i*Math.PI/4;
        rect(cx+Math.cos(a)*bloom-2,cy+Math.sin(a)*bloom-2,4,4,i%2?'#ffc14d':'#ffe387');}
      rect(cx-2,cy-2,5,5,'#8c4b23');rect(cx-1,cy-1,2,2,'#c17932');
    }
  }
  const clamp=n=>Math.max(0,Math.min(1,n));
  function pixelLine(x,y,ex,ey,color,size=1){
    const count=Math.max(1,Math.ceil(Math.max(Math.abs(ex-x),Math.abs(ey-y))));
    for(let j=0;j<=count;j++)rect(x+(ex-x)*j/count,y+(ey-y)*j/count,size,size,color);
  }
  function disk(x,y,r,color){
    for(let dy=-r;dy<=r;dy++){const w=Math.floor(Math.sqrt(r*r-dy*dy));rect(x-w,y+dy,w*2+1,1,color);}
  }
  function village(t,dark){
    for(let i=0;i<5;i++)rect(0,24*i,320,24,(dark?['#181a30','#27283e','#424055','#675462','#8d6964']:['#6f8b9e','#98a6a4','#d3b396','#f0c18c','#fad69a'])[i]);
    disk(64,32,12,dark?'#a78583':'#ffe7a6');
    for(let x=0;x<320;x+=3){
      const y=65+11*Math.sin(x*.036)+4*Math.cos(x*.11);
      rect(x,y,3,105-y,dark?'#474052':'#958384');
    }
    for(let j=0;j<10;j++){
      const x=j*38-8,y=80+(j*7)%12;
      rect(x,y,23,24,dark?'#3f3949':'#a07763');
      for(let r=0;r<8;r++)rect(x-3+r,y-r,29-2*r,1,dark?'#292a38':'#6b565b');
      rect(x+5,y+6,4,5,dark?'#816353':'#efcc8e');
    }
    rect(0,103,320,37,'#4b413a');rect(0,103,320,3,dark?'#74704e':'#aec273');
    rect(100,103,44,37,'#283944');
    for(let j=0;j<15;j++)rect(101+(j*13+t*6)%39,110+j*7%29,3,1,'#587477');
  }
  function bell(t,swing){
    rect(31,53,4,50,'#453837');rect(61,53,4,50,'#453837');rect(29,51,38,4,'#695046');
    const x=48+Math.sin(t*4)*swing;
    pixelLine(48,55,x,64,'#c6a581');rect(x-4,64,9,6,'#b68349');
    rect(x-6,69,13,3,'#f2c577');rect(x,72,2,3,'#deb77b');pixelLine(x+3,71,58,90,'#aa936d');
  }
  function gate(x,y,h,t){
    for(let i=0;i<h;i+=2){
      const width=Math.round(10*Math.sqrt(1-Math.pow((i-h/2)/(h/2),2)));
      rect(x-width,y+i,2*width+1,2,'#ac8ed4');
      if(width>2)rect(x-width+2,y+i,width*2-3,2,'#292038');
    }
    for(let i=0;i<5;i++)rect(x-5+(i*11)%10,y+4+(t*8+i*7)%(h-8),1,2,'#cfb8ee');
  }
  function hand(t){
    const x=156+Math.sin(t*.8)*2,y=39+Math.sin(t)*2;
    rect(x-8,0,16,y,'#302839');rect(x-15,y-1,32,17,'#776175');
    for(let i=0;i<5;i++){
      const tip=x-14+i*7+(i-2)*clamp(t/3)*2;
      pixelLine(x-13+i*7,y+12,tip,y+21+i%2*4,'#a48592',3);
      if(i%2)continue;
      const end=56+i*52;
      pixelLine(tip,y+24,end,97+Math.sin(t*2+i)*3,'#a5809f');
      gate(end,95,25,t+i);
    }
  }
  function beat(t,a,b){const p=clamp((t-a)/(b-a));return p*p*(3-2*p);}
  function polygon(points,color){
    g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(Math.round(x),Math.round(y)):g.moveTo(Math.round(x),Math.round(y)));g.closePath();g.fill();
  }
  function sprout(x,y,t){
    const h=74*beat(t,.4,7.6),b=beat(t,6.8,9.7),tip=x+Math.sin(h/27)*4;
    if(h<1)return;
    pixelLine(x,y,tip,y-h,'#39613e',3);pixelLine(x+1,y,tip+1,y-h,'#83a955');
    for(let i=0;i<3;i++){
      const f=beat(t,2+i*1.05,4+i*1.05),side=i%2?1:-1;
      if(!f)continue;
      const ly=y-h*(.25+i*.17),lx=x+2;
      polygon([[lx,ly],[lx+side*13*f,ly-2],[lx+side*21*f,ly-11*f],[lx+side*8*f,ly-10*f]],'#558346');
      pixelLine(lx,ly,lx+side*17*f,ly-8*f,'#b5c979');
    }
    const r=Math.round(5*beat(t,4.5,7));
    if(r)disk(tip+1,y-h,r,'#748a42');
    if(!b)return;
    for(let j=0;j<14;j++){
      const a=j*Math.PI/7,c=Math.cos(a),s=Math.sin(a),cy=y-h,reach=4+15*b;
      polygon([[tip+c*3,cy+s*3],[tip+c*10*b-s*3*b,cy+s*10*b+c*3*b],[tip+c*reach,cy+s*reach],[tip+c*10*b+s*3*b,cy+s*10*b-c*3*b]],j%2?'#ffdc60':'#e9a035');
    }
    disk(tip,y-h,Math.ceil(6*b),'#613a28');
    if(b>.55){rect(tip-3,y-h-2,2,2,'#c7954c');rect(tip+1,y-h,2,2,'#c7954c');}
  }
  function actor(who,x,y,t,opts={}){
    const phase=opts.walk?t*8*opts.walk:0,scale=opts.size||1,face=opts.face||1;
    if(who==='hero'){drawHero(g,x,y,scale*face,scale,phase,opts.arm||0,opts.bend||0);return;}
    drawCast(g,who,x,y,face,scale,phase,opts.arm||0,opts.smile);
  }
  function stage(t,dark,pan){
    village(t,dark);
    for(let i=0;i<4;i++){
      const x=(i*98+340-t*(reduce?.5:1.4)-pan*.18)%365-20;
      rect(x,14+i%3*7,31,2,dark?'#494656':'#d7c7b1');rect(x+7,12+i%3*7,16,2,dark?'#494656':'#d7c7b1');
    }
    for(let j=-1;j<9;j++){
      const x=j*48-pan*.4;
      rect(x,100,3,4,'#493f3e');rect(x-1,97,5,3,dark?'#555148':'#727952');
    }
  }
  function landscape(t){
    const camera=reduce?0:beat(t,0,12);
    g.save();g.imageSmoothingEnabled=false;
    if(scene===2){
      rect(0,0,320,140,'#13101e');
      for(let i=0;i<9;i++){const x=i*49-34;polygon([[x,0],[x+20,0],[x+9,37+i%3*14]],'#302338');}
      for(let i=0;i<60;i++)rect((i*47+11)%320,(i*29+t*3)%140,1,1,'#805d89');
      g.translate(0,-17+18*beat(t,0,5));actor('shadow',160,118,t,{size:2.5,arm:.5+beat(t,3,7)});hand(t);
      for(let j=0;j<3;j++){const rise=beat(t,4+j*.7,9+j);if(rise>0){const x=56+j*104;disk(x,119-rise*14,Math.ceil(rise*3),'#8e6a98');}}
      g.restore();return;
    }
    // A moving crop follows the actors across the landscape.
    const zoom=[1.04,1.24,1,1.02,1.39,1.18,1.36,1.09][scene];
    const endX=[12,25,0,5,65,35,26,25][scene];
    const lens=1+(zoom-1)*(.72+.28*camera);g.scale(lens,lens);g.translate(-endX*(.45+.55*camera),-(zoom-1)*86);
    stage(t,scene!==0,endX*camera);
    if(scene===3){
      rect(0,99,322,48,'#28424c');
      for(let j=0;j<25;j++)rect((j*19+t*7)%323,106+j*7%33,8,1,'#557881');
      for(let i=0;i<13;i++){
        const x=i*26,fall=(i>=5&&i<=8)?beat(t,4+Math.abs(i-6)*.4,7+Math.abs(i-6)*.4):0;
        g.save();g.translate(x,92+58*fall);g.rotate(fall*(i%2?.9:-.6));
        rect(0,0,25,8,'#987d68');rect(0,1,25,2,'#c79f79');
        if(i%3===0)rect(4,8,8,43,'#68554e');g.restore();
      }
      for(let i=0;i<3;i++){
        const x=48+i*99;gate(x,46,44,t);
        const p=beat(t,i*.7,7+i),dx=x+40*p,y=94-Math.sin(p*Math.PI)*25;
        const sprite=bossArt[['mogger','six7','tung'][i]];
        if(sprite?.naturalWidth)g.drawImage(sprite,dx-16,y-34,32,34);
        else actor('verity',dx,y,t,{walk:1});
      }
      const f=beat(t,4.8,8);rect(162+40*f,84+40*f,8,9,'#c09a67');
      for(let j=0;j<10;j++){const p=beat(t,6+j*.06,8+j*.06);rect(174+(j-4)*p*7,116-Math.sin(p*Math.PI)*18,2,2,'#9abbb2');}
      g.restore();return;
    }
    bell(t,scene===0&&t<4||scene===1||scene===7?5:0);
    if(scene===0){
      actor('lia',57,104,t,{arm:t<4?.5+.45*Math.sin(t*4):0});
      actor('verity',166,103,t,{face:-1,arm:.45+.25*Math.sin(t*2)});
      const run=beat(t,2,10),jump=beat(t,4,8);
      actor('hero',65+95*run,104-34*Math.sin(jump*Math.PI),t,{walk:1,arm:.4*Math.sin(jump*Math.PI)});
      for(let i=0;i<5;i++)flower(179+i*30,114,10+beat(t,2,8)*4,4,2);
    }else if(scene===1){
      actor('lia',58+24*beat(t,1,6),103,t,{walk:t<6?.8:0,face:-1});
      actor('hero',67+31*beat(t,2,7),106,t,{walk:t<7?1:0,bend:beat(t,6,9)});
      const y=139-23*beat(t,3,8);
      rect(113,y,12,13,'#a4829d');for(let i=0;i<4;i++)rect(112+i*4,y-5-i%2*4,3,9,'#c6a2b7');
      for(let i=0;i<3;i++)rect(103,122+i*4+Math.sin(t*2+i)*2,35,1,'#67929b');
    }else if(scene===4){
      gate(212,51,53,t);
      const x=212-83*beat(t,.4,6),pull=beat(t,6,9);
      actor('hero',85+20*beat(t,1,6)-14*pull,106,t,{walk:t<5?.8:0});
      actor('verity',x+8*pull,104,t,{face:-1,size:1.28,walk:t<6?.85:0,arm:.6+.6*pull,smile:pull>.4});
      if(t>4)pixelLine(x-14,83-17*pull,251+10*pull,3,'#cb9fcd');
    }else if(scene===5){
      const close=beat(t,3,7);
      actor('lia',48+51*beat(t,0,4),103,t,{walk:t<4?1:0,arm:.6+.4*Math.sin(t*3)});
      rect(105,68,4,58,'#513e37');rect(139,68,4,58,'#513e37');
      for(let i=0;i<4;i++)rect(108,69+close*27+i*5,31,4,i%2?'#836550':'#987a57');
      disk(100,86,6,'#806653');pixelLine(100,86,100+Math.sin(t*3)*5,86+Math.cos(t*3)*5,'#e3c28c',2);
      actor('verity',168,104,t,{face:-1,size:1.22,arm:1.2*(1-close)});
      if(close<.91)pixelLine(153,72+15*close,235,4,'#cfabd4');
      actor('hero',78,104,t,{arm:.55*(1-close)});
    }else if(scene===6){
      const reach=beat(t,1,4);
      actor('lia',74+12*reach,109,t,{bend:reach,arm:.35});
      rect(97,90,5,7,'#a7c4c4');
      if(t>2&&t<5)rect(100,96+((t-2)*14)%17,2,3,'#c9eee5');
      g.save();g.translate(107,116);g.scale(.5,.5);sprout(0,0,Math.max(0,t-2));g.restore();
      for(let i=0;i<60*beat(t,7,12);i++)rect(109+i*2.2,76+i*.26+Math.sin(t*2+i*.3)*3,2,1,'#f3cd66');
      actor('hero',158-23*beat(t,2,8),107,t,{face:-1,walk:t<8?.7:0});
    }else{
      gate(252,54,50,t);actor('lia',55,104,t,{arm:.6+.4*Math.sin(t*3)});
      const run=beat(t,1,11),jump=beat(t,3.8,6.8);
      actor('hero',66+164*run,104-42*Math.sin(jump*Math.PI),t,{walk:1,arm:.65*Math.sin(jump*Math.PI)});
      actor('guide',251-10*beat(t,7,11),104,t,{face:-1,arm:.7});
      for(let i=0;i<24;i++)rect(126+i*5,83+Math.sin(t*2+i*.4)*3,1,1,'#f6d675');
    }
    g.restore();
  }
  function show(i){
    scene=i;began=null;document.getElementById('shotName').textContent=scenes[i][0];overlay.classList.add('story');actions.hidden=false;
    lastBeat=-1;sayBeat(1);next.textContent=i===scenes.length-1?'Entrar no jogo ▸':'Continuar ▸';
  }
  function finish(){
    if(!alive)return;alive=false;silenceVoice();overlay.remove();
    document.body.classList.remove('opening-active');
    trainingReturn=unlockedLevel;startLevel(0,true);
    const game=document.getElementById('game');game.tabIndex=-1;game.focus({preventScroll:true});
  }
  function advance(){if(scene===scenes.length-1)finish();else if(scene>=0)show(scene+1);}
  next.onclick=advance;document.getElementById('skipStory').onclick=finish;
  window.addEventListener('keydown',function guard(e){
    if(!alive){window.removeEventListener('keydown',guard,true);return;}
    if(naming){e.stopImmediatePropagation();if(e.key==='Enter' && e.target===input && !e.isComposing){e.preventDefault();beginStory();}return;}
    if(e.key==='Tab')return;
    e.stopImmediatePropagation();
    if(e.repeat)return;
    if((e.key==='Enter'||e.key===' ') && document.activeElement?.tagName==='BUTTON')return;
    e.preventDefault();
    if(scene>=0 && e.key==='Escape')finish();
    else if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight')advance();
  },true);
  function frame(now){
    if(!alive)return;
    if(began===null)began=now;
    const elapsed=(now-began)/1000;
    if(naming && now-lastPaint>=80 && (!reduce || walking)){lastPaint=now;paintPreview(now/1000);}
    if(scene<0 && !naming){
      rect(0,0,320,140,'#000');sprout(159,113,elapsed);
      rect(119,114,82,4,'#70513a');rect(124,118,72,4,'#3c2d25');
      for(let i=0;i<12;i++)rect(123+i*6,115+i%3,3,1,'#9d7851');
      const split=beat(elapsed,0,2)*5;
      rect(155-split,112,5,2,'#937055');rect(160+split,112,5,2,'#937055');
      if(elapsed>=10.5)chooseName();
    }
    if(scene>=0){
      const time=began===null?0:elapsed;
      landscape(time);
      const fade=reduce?0:Math.max(0,1-time/.65);if(fade){g.save();g.globalAlpha=fade;rect(0,0,320,140,'#171321');g.restore();}
      if(lastBeat===1 && time>=6 && (!activeVoice || time>=14))sayBeat(2);
      if(!reduce && time>=13.5 && (!activeVoice || time>=26))advance();
    }
    if(alive)requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

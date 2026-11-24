const hairProfiles = [
 [.84,.78,0,0], [1.06,.96,1,0], [1.03,1,0,12], [1.02,1.05,0,0], [.80,.53,0,0],
 [.88,.75,0,0], [.67,1.07,0,0], [.98,.92,0,2], [1.13,1.07,2,1], [.84,.91,0,5],
 [.94,.82,0,8], [1.04,.76,0,2], [1.07,.97,1,10], [.95,.97,2,7], [.91,.83,0,1],
 [1.05,1,3,0], [.84,.62,0,0], [.9,.89,0,11], [.95,.87,2,13], [.86,.96,0,1]
];
function dyeColor(color,from,to){
  if(from===to)return color;
  const rgb=h=>[1,3,5].map(j=>parseInt(h.slice(j,j+2),16));
  const rgb0=rgb(from),rgb1=rgb(to),src=rgb(color);
  const light=src[0]*.30+src[1]*.56+src[2]*.14;
  const mid=rgb0[0]*.30+rgb0[1]*.56+rgb0[2]*.14;
  return 'rgb('+src.map((v,k)=>Math.max(0,Math.min(255,Math.round(rgb1[k]*Math.min(1,light/mid)+Math.max(0,light-mid)*.74+(v-light-rgb0[k]+mid)*.18))))+')';
}
function nativeHero(a){return illustratedHero(a);}
function paintApprentice(a){
  const female=a.gender==='Mulher',bodyArt=female?femaleApprentice:costumeArt[0];
  const frame=pixelPaper(40,64),ctx=frame.getContext('2d');
  const types=['cut','outfit','pants'],kits=types.map(k=>costumes.findIndex(s=>s[pieceColumn[k]]===a[k]));
  const styles=types.map(k=>stylesByGender[a.gender][k].indexOf(a[k]));
  const hat=stylesByGender[a.gender].accessory.indexOf(a.accessory);
  const [cut,top,trousers]=styles,profile=hairProfiles[cut]||[1,1,0,0];
  const headKit=kits[0]>0?kits[0]:(female?5:0);
  drawEquipment(ctx,hat,a,headKit,true);
  function put(x,y,color){ctx.fillStyle=color;ctx.fillRect(x,y,1,1);}
  function material(art,tag,index,palette,k){
    const base=['','#e9b18d','#523537',costumes[k][4],costumes[k][5],'#5d714e'];
    const chosen=['',a.skin,a.hair,a.cloth,a.leg,a.eyes];
    const key=tag*256+index;
    if(!palette.has(key)){
      let color=art.colors[index];
      if(tag===5)color=a.eyes;
      else if(tag && chosen[tag]!==base[tag]){
        const rgb=h=>[1,3,5].map(j=>parseInt(h.slice(j,j+2),16));
        const lum=h=>{const [r,g,b]=rgb(h);return .299*r+.587*g+.114*b;};
        const shade=lum(color)-art.pivots[tag];
        const channels=rgb(chosen[tag]).map(v=>Math.round(shade<0?v*Math.max(.18,1+shade/145):v+(255-v)*Math.min(.82,shade/175)));
        color='rgb('+channels.join(',')+')';
      }
      palette.set(key,color);
    }
    return palette.get(key);
  }
  for(const slot of [2,1,0]){
    const k=Math.max(0,kits[slot]),art=k===0?bodyArt:costumeArt[k],cache=new Map();
    const [start,end]=[[0,24],[24,39],[39,64]][slot];
    const style=styles[slot];
    for(let y=start;y<end;y++)for(let x=0;x<40;x++){
      let sx=x,sy=y;
      if(slot===0&&cut>=0){
        // Keep facial landmarks fixed. Resample only the crown and back of the haircut.
        const original=y*40+x;
        const lockedFace=art.tags[original]===1||art.tags[original]===5;
        if(!lockedFace&&(y<14||x<23||art.tags[original]===2)){
          sx=Math.round(24+(x-24)/profile[0]);sy=Math.round(17+(y-17)/profile[1]);
          if(profile[2])sy+=Math.round(Math.sin(x*(cut===15?1.7:.8))*profile[2]);
          if(cut===7||cut===14)sy+=Math.round((x-22)*.17);
          if(cut===19&&x<17)sy+=2;
        }
      }
      if(slot===2&&style>=0&&![1,10,16].includes(style)&&y>=50&&y<56&&art.tags[y*40+x]===1){
        // Extend only the fabric directly above a bare calf, preserving hands and boots.
        for(let hem=50;hem>=44;hem--)if(art.tags[hem*40+x]===4){sy=hem;break;}
      }
      if(sx<0||sx>=40||sy<0||sy>=64)continue;
      const pos=sy*40+sx,v=art.pixels[pos];if(!v)continue;
      let tag=art.tags[pos];
      if(slot===0&&(sx!==x||sy!==y)&&(tag===1||tag===5))continue;
      let color=material(art,tag,v-1,cache,k);
      if(slot===1&&style>=0&&tag===3){
        const col=(mix)=>dyeColor(art.colors[v-1],costumes[0][4],mix);
        const accent=['#c8b682','#527986','#95613c','#597665','#975334','#83938b','#995b52','#476b7a','#d6ac55','#8c6e91','#6a7e78','#726855','#8d6551','#bb9552','#768d91','#98784c','#718d89','#995551','#946d49','#735e79'][style];
        const marks=[y===34,(y%4)<2,x<17||x>25,Math.abs(x-23)===y-25,x<18||y===32,x+y===49||x+y===50,x%5===0||y%4===0,y>=31||x===19||x===25,x<17,(x+y)%7<2||((40-x+y)%7<2),x<18||x===23,y%3===0&&x===22,y>=34&&y<=36,x===22||x===23,y>34||y<28,y===33||x===26,y%5===1,y===33||x<16,Math.abs(x+y-52)<2,x<22];
        if(marks[style])color=col(accent);
      }
      if(slot===2&&style>=0&&tag===4){
        const pattern=[x===22,y===50,x<19&&y>=44&&y<=47,y>50,y>=49&&y<=51,x%12<2,x===15||x===24,x<17&&y>43&&y<48,y>49,x%5===1||y%5===0,y===48||y===49,y>=47&&y<=50,x===24,y===45||y===46,x>=22&&x<=26&&y>=44&&y<=47,y%4===1,y===51,y===48||y===50,Math.abs(x+y-62)<2,x%10===0];
        if(pattern[style])color=dyeColor(art.colors[v-1],costumes[0][5],['#8c7967','#a49d83','#647a4b','#465d60','#9aaebc','#ba9b61','#687466','#95735c','#855941','#837086','#d0a366','#536472','#9d9c8a','#bf9459','#788852','#99adad','#b8a382','#6ba2a7','#bf945f','#c59e63'][style]);
      }
      put(x,y,color,slot);
    }
    if(slot===0&&cut>=0&&profile[3]){
      // Length is attached behind the ear and follows the same head transform.
      const n=profile[3]+(female?2:0),anchor=female?12:13;
      for(let j=0;j<n;j++){
        const centre=anchor-Math.round(3*Math.sin(j/n*2.4))+(cut===18?j%3===0?1:0:0);
        const width=Math.max(1,Math.round((cut===9?6:5)*(1-j/n)));
        for(let dx=0;dx<width;dx++)put(centre+dx,18+j,dyeColor(['#38242b','#774331','#995a39','#5b322c'][(dx+j%2)%4],'#523537',a.hair),0);
      }
    }
  }
  drawEquipment(ctx,hat,a,headKit,false);
  return frame;
}
const look={gender:savedLook?.gender==='Mulher'?'Mulher':'Homem'};
function choicesFor(key,gender=look.gender){
  if(key==='skin'&&/^#[0-9a-f]{6}$/i.test(savedLook?.skin)&&!wardrobe.skin.includes(savedLook.skin))return [...wardrobe.skin,savedLook.skin];
  if(key==='accessory')return ['Nenhum',...stylesByGender[gender].accessory];
  if(pieceColumn[key])return [...stylesByGender[gender][key],costumes[0][pieceColumn[key]]];
  return stylesByGender[gender][key]||wardrobe[key];
}
for(const key of Object.keys(wardrobe)){
  let old=savedLook?.[key];const list=choicesFor(key);
  if(pieceColumn[key]){
    const oldKit=costumes.findIndex(set=>set[pieceColumn[key]]===old);
    if(oldKit>0)old=uniformPiece(look.gender,key,oldKit);
  }
  if(old && !list.includes(old)){
    const legacy=wardrobe[key].indexOf(old);
    if(legacy>=0 && stylesByGender[look.gender][key]){
      const positions={outfit:[0,10,7,5],pants:[0,1,2],accessory:[-1,1,2,3],cut:[0,1,2,3,4]};
      old=stylesByGender[look.gender][key][positions[key][legacy]]||'Nenhum';
    }
  }
  const customColor=['cloth','eyes','hair','leg','skin'].includes(key) && /^#[0-9a-f]{6}$/i.test(old);
  look[key]=list.includes(old)||customColor?old:list[0];
}
if(!savedLook)Object.assign(look,{cut:'Topete',outfit:'Colete de trilha',pants:'Cargo',accessory:'Nenhum',skin:'#e9b18d',hair:'#523537',eyes:'#5d714e',cloth:'#ce7841',leg:'#596e62'});
if(!savedLook)equipCostume(look,0);
const idleFrames=new Map();
const heroFrames=new Map();
function drawHero(c,x,y,scaleX,scaleY,stride=0,reach=0,bend=0,appearance=look){
  const phase=stride===0?-1:(Math.floor(stride*4/Math.PI)%8+8)%8,arm=Math.round(reach*3),lean=Math.round(bend*2);
  const key=JSON.stringify(appearance)+'/'+[phase,arm,lean];
  let frame=heroFrames.get(key);
  if(!frame){
    const identity=JSON.stringify(appearance);
    let rest=idleFrames.get(identity);
    if(!rest){
      rest=nativeHero(appearance);
      if(idleFrames.size>=64)idleFrames.delete(idleFrames.keys().next().value);
      idleFrames.set(identity,rest);
    }
    frame=walkFrame(rest,phase,arm,lean);
    if(heroFrames.size>=200)heroFrames.delete(heroFrames.keys().next().value);
    heroFrames.set(key,frame);
  }
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(scaleX*(appearance.body==='Esguio'?.90:1),scaleY);
  c.imageSmoothingEnabled=false;c.drawImage(frame,-11,-36,22.5,36);c.restore();
}

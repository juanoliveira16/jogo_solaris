// Individually illustrated wearable pieces. All placements are in 40 × 64 sprite coordinates.
const studioCache=new Map();
function studioTile(group,id,tint,base){
  const key=[group,id,tint].join('/');
  if(studioCache.has(key))return studioCache.get(key);
  const [w,h,swatches,packed]=atelierTiles[group][id],canvas=pixelPaper(w,h),c=canvas.getContext('2d');
  const bytes=atob(packed);
  const colors=swatches.map(hex=>{
    if(!tint||tint===base)return hex;
    const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),[r,g,b]=channels;
    const trim=group!=='hair'&&r>g*1.13&&g>b*1.32;
    if(trim||Math.max(...channels)<40)return hex;
    const value=(r*.30+g*.56+b*.14)/160,chosen=[1,3,5].map(i=>parseInt(tint.slice(i,i+2),16));
    return 'rgb('+chosen.map(v=>Math.round(value<1?v*value:v+(255-v)*Math.min(.8,value-1)))+')';
  });
  for(let pos=0;pos<bytes.length;pos++){const i=bytes.charCodeAt(pos);if(i){c.fillStyle=colors[i-1];c.fillRect(pos%w,Math.floor(pos/w),1,1);}}
  if(studioCache.size>240)studioCache.clear();
  studioCache.set(key,canvas);return canvas;
}
const gearPositions=[
 [5,0,29,13],[13,13,18,6],[13,23,16,10],[22,26,8,8],[5,0,27,12],
 [2,0,34,15],[8,3,22,19],[17,16,15,8],[23,13,8,12],[18,17,4,8],
 [14,24,14,11],[19,24,8,13],[0,25,14,17],[5,3,26,11],[6,0,25,11],
 [5,0,28,14],[6,5,29,9],[6,23,21,15],[10,9,10,9],[12,36,17,8]
];
function illustratedHero(a){
  const pieces=stylesByGender[a.gender],custom=Object.fromEntries(Object.keys(pieces).map(k=>[k,pieces[k].indexOf(a[k])]));
  const original={...a,accessory:'Nenhum'};
  for(const [key,col] of Object.entries(pieceColumn))original[key]=costumes[0][col];
  const base=paintApprentice(original),c=base.getContext('2d'),female=a.gender==='Mulher';
  c.imageSmoothingEnabled=false;
  const clean=c.getImageData(0,0,40,64),modified=c.getImageData(0,0,40,64),art=costumeArt[female?5:0];
  const bodyHead=costumes.findIndex(set=>set[1]===original.cut);
  const eyes=[[27,17],[26,17],[26,19],[29,15],[29,17],[27,16]],eye=eyes[bodyHead===0&&female?5:Math.max(0,bodyHead)];
  const place=(kind,i,x,y,w,h,tint,source)=>c.drawImage(studioTile(kind,i,tint,source),x,y,w,h);
  // Clear only the silhouette of the slot being replaced. The fingers, face and shoes stay on top.
  for(let y=0;y<59;y++)for(let x=0;x<40;x++){
    const n=y*40+x;
    if(custom.cut>=0&&y<24&&art.tags[n]!==1&&art.tags[n]!==5||
       custom.outfit>=0&&y>=24&&y<38&&art.tags[n]===3||
       custom.pants>=0&&y>=39&&y<54&&art.tags[n]!==1&&x>=12&&x<30 || custom.pants>=0&&y>=47&&y<54&&art.tags[n]!==1)modified.data[n*4+3]=0;
  }
  c.putImageData(modified,0,0);
  const fitted=tailor(c,a);
  if(custom.pants>=0)fitted.trousers(custom.pants);
  if(custom.outfit>=0)fitted.blouse(custom.outfit);
  if(custom.cut>=0){
    fitted.haircut(custom.cut);
    // Preserve the visible eye and cheek inside the side-profile opening.
    for(let y=13;y<24;y++)for(let x=21;x<33;x++){const n=y*40+x;
      if(art.tags[n]===1||art.tags[n]===5||(x>=24&&x<=30&&y>=15&&y<=19&&clean.data[n*4+3]&&art.tags[n]!==2))c.putImageData(clean,0,0,x,y,1,1);
    }
  }
  if(custom.pants>=0||custom.outfit>=0){
    for(let y=34;y<47;y++)for(let x=0;x<40;x++){const n=y*40+x;if((x<14||x>=30)&&art.tags[n]===1)c.putImageData(clean,0,0,x,y,1,1);}
  }
  if([2,6,11,17].includes(custom.accessory))fitted.gear(custom.accessory);
  else if(custom.accessory>=0){
    const i=custom.accessory,pos=gearPositions[i].slice(),head=[0,1,4,5,6,7,8,9,13,14,15,16].includes(i);
    if(head){pos[0]+=eye[0]-27;pos[1]+=eye[1]-17;}
    if(i===3&&female){pos[0]=11;pos[1]=10;}if(i===18&&!female){pos[0]=18;pos[1]=24;}
    if(i===12)c.globalCompositeOperation='destination-over';
    place('accessories',i,...pos);c.globalCompositeOperation='source-over';
  }
  return base;
}
function drawCast(c,who,x,y,face,size,phase=0,arm=0,smile=false){
  const id={guide:0,lia:1,verity:2,shadow:3}[who],pose=phase?(Math.floor(phase*4/Math.PI)%8+8)%8:-1;
  const key=['cast',id,pose,Math.round(arm*3)].join('/');
  let sprite=heroFrames.get(key);
  if(!sprite){sprite=walkFrame(studioTile('cast',id),pose,Math.round(arm*3),0);if(heroFrames.size>=200)heroFrames.delete(heroFrames.keys().next().value);heroFrames.set(key,sprite);}
  c.save();c.translate(x,y);c.scale(face*size,size);c.imageSmoothingEnabled=false;
  const breath=phase?0:Math.sin((typeof levelTime==='number'?levelTime:0)*.06)*.25;
  c.drawImage(sprite,-12,-36+breath,24,36);
  if(smile&&who==='verity'){c.fillStyle='#efd8c1';c.fillRect(3,-25,3,1);}
  c.restore();
}

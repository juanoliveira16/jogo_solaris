// Fixed native-resolution backplates and reusable masonry on the collision surfaces.
const panoramaPaths=['assets/cenarios/patio.png','assets/cenarios/forja.png','assets/cenarios/farol.png','assets/cenarios/gelo.png','assets/cenarios/avesso.png','assets/cenarios/arena.png'];
const panoramas=panoramaPaths.map(src=>{const image=new Image();image.src=src;return image;});
function paintPanorama(c,region,w,h){
  const image=panoramas[region];if(!image.complete||!image.naturalWidth)return false;
  c.save();c.imageSmoothingEnabled=false;
  const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);
  const sw=w/scale,sh=h/scale;
  c.drawImage(image,(image.naturalWidth-sw)/2,(image.naturalHeight-sh)/2,sw,sh,0,0,w,h);
  c.restore();return true;
}
const stonePalettes=[
 ['#384644','#525544','#646545','#87815a','#a7a477','#7f995e','#d4c185'],
 ['#322e36','#59403d','#744e40','#946652','#b0885e','#b27750','#dfa665'],
 ['#293a53','#384d62','#4b6575','#65838a','#91aaa5','#78a4a0','#becfc6'],
 ['#354e67','#49677d','#608097','#83a6b1','#b2cdd2','#a7d9dc','#e2f1dd'],
 ['#302c45','#493952','#614860','#805e78','#9c7f96','#a0779c','#d0adca'],
 ['#23363b','#34484b','#4b6060','#66756b','#879483','#977b52','#d4ad67']
];
const wallTiles=new Map();
function masonry(region){
  if(wallTiles.has(region))return wallTiles.get(region);
  const tile=pixelPaper(96,64),c=tile.getContext('2d'),p=stonePalettes[region];let seed=region+907;
  const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*n);};
  function brick(x,y,w,h){
    const col=1+rand(2);
    for(const offset of [-96,0,96]){
      const a=x+offset;c.fillStyle=p[col];c.fillRect(a+1,y+1,w-2,h-2);
      c.fillStyle=p[col+1];c.fillRect(a+2,y+1,w-5,2);
      c.fillStyle=p[col+2];c.fillRect(a+2,y+2,3+rand(3),1);
      c.fillStyle=p[1];c.fillRect(a+w-4,y+4,2,h-6);
      c.fillStyle=p[0];c.fillRect(a+1,y+h-3,2,2);
      for(let n=0;n<3;n++){c.fillStyle=p[col+1];c.fillRect(a+2+rand(w-6),y+4+rand(h-7),1+rand(3),1);}
    }
  }
  c.fillStyle=p[0];c.fillRect(0,0,96,64);
  for(let row=0;row<4;row++){let x=row%2?-12:0;for(const w of [24,18,30,24]){brick(x,row*16,w,16);x+=w;}}
  wallTiles.set(region,tile);return tile;
}
function paintTerrain(c,p,region){
  const colors=stonePalettes[region],tile=masonry(region),x=Math.round(p.x),y=Math.round(p.y);
  c.save();c.beginPath();c.rect(x,y,p.w,p.h);c.clip();c.imageSmoothingEnabled=false;
  for(let yy=y;yy<y+p.h;yy+=64)for(let xx=x;xx<x+p.w;xx+=96)c.drawImage(tile,xx,yy);
  c.fillStyle=colors[0];c.fillRect(x,y+5,p.w,2);c.fillStyle=colors[5];c.fillRect(x,y,p.w,5);
  for(let xx=x;xx<x+p.w;xx+=13){c.fillStyle=colors[6];c.fillRect(xx+1,y,10,2);c.fillStyle=colors[3];c.fillRect(xx+6,y+3,8,1);
    if(region===0){c.fillStyle=colors[5];c.fillRect(xx+3,y+4,3,3+(xx%3));}}
  c.restore();
}

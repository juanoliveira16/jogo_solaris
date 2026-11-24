const costumeArt=apprenticeAtlas.map(source=>{
  const pixels=Uint8Array.from(source.rows.join(''),ch=>'.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'.indexOf(ch));
  const tags=Uint8Array.from(source.materials.join(''),Number);
  const luma=source.colors.map(h=>[1,3,5].reduce((sum,j,i)=>sum+parseInt(h.slice(j,j+2),16)*[.299,.587,.114][i],0));
  const pivots=[0];
  for(let tag=1;tag<=5;tag++){
    const samples=[];
    tags.forEach((v,i)=>{if(v===tag&&pixels[i])samples.push(luma[pixels[i]-1]);});
    samples.sort((a,b)=>a-b);pivots[tag]=samples[Math.floor(samples.length*.55)]||128;
  }
  return {colors:source.colors,pixels,tags,pivots};
});
const femaleApprentice=costumeArt[5];

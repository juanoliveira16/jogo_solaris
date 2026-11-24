const controlDefs = [
  {id:'left', label:'Esquerda', icon:'◀', key:'KeyA', aliases:['ArrowLeft'], x:9,y:83},
  {id:'right', label:'Direita', icon:'▶', key:'KeyD', aliases:['ArrowRight'], x:24,y:83},
  {id:'jump', label:'Pular', icon:'Pular', key:'Space', aliases:['ArrowUp','KeyW'], x:90,y:83},
  {id:'dash', label:'Impulso', icon:'Impulso', key:'ShiftLeft', aliases:['ShiftRight'], x:75,y:83},
  {id:'fire', label:'Atirar', icon:'Atirar', key:'KeyJ', aliases:['KeyZ'], x:90,y:65},
  {id:'pause', label:'Pausa', icon:'Ⅱ', key:'KeyP', aliases:[], x:10,y:17}
];
const controlsKey='solaris_controles_v1';
const defaults=()=>({...Object.fromEntries(controlDefs.map(d=>[d.id,{x:d.x,y:d.y,key:d.key}])),arrowFire:false});
let controls=defaults(), draft=null, capturing=null, drag=null, wasPaused=false;
const savedControls=safeJSON(controlsKey,{});
controls.arrowFire=savedControls?.arrowFire===true;
for(const d of controlDefs){
  const v=savedControls?.[d.id];
  if(v && Number.isFinite(v.x) && Math.abs(v.x-50)<=43 && Number.isFinite(v.y) && Math.abs(v.y-50)<=42 && typeof v.key==='string') controls[d.id]={x:v.x,y:v.y,key:v.key};
}
const dialog=document.getElementById('controlDialog'), field=document.getElementById('layoutField');
const note=document.getElementById('controlNote'), fingers=new Map();
const touchHeld=id=>Array.from(fingers.values()).includes(id);
let touchMode=navigator.maxTouchPoints>0;
function keyLabel(k){return ({Space:'Espaço',ShiftLeft:'Shift esq.',ShiftRight:'Shift dir.',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'})[k] || k.replace(/^Key|^Digit/,'');}
function arrowAim(){
  if(!controls.arrowFire)return null;
  const x=Number(!!keys.AimArrowRight)-Number(!!keys.AimArrowLeft);
  const y=Number(!!keys.AimArrowDown)-Number(!!keys.AimArrowUp);
  return x||y ? Math.atan2(y,x) : null;
}
function gameCode(code){
  if(controls.arrowFire && code.startsWith('Arrow'))return 'Aim'+code;
  const main=controlDefs.find(d=>controls[d.id].key===code);
  if(main)return main.key;
  const alias=controlDefs.find(d=>d.aliases.includes(code) && controls[d.id].key===d.key);
  if(alias)return code;
  if(controlDefs.some(d=>d.key===code || d.aliases.includes(code)))return '';
  return code;
}
function refreshHints(){
  document.querySelector('.footer-hint').textContent=controlDefs.map(d=>d.label+' · '+keyLabel(controls[d.id].key)).join('   |   ')+(controls.arrowFire?'   |   Mirar e atirar · Setas':'')+'   |   Portais · Esc';
}
function openControls(){
  wasPaused=paused;releaseAll();draft=structuredClone(controls);capturing=null;note.textContent='';
  document.getElementById('touchEditor').open=touchMode;renderControls();dialog.showModal();
}
function renderControls(){
  document.getElementById('aimArrows').checked=draft.arrowFire;
  document.getElementById('aimClassic').checked=!draft.arrowFire;
  field.replaceChildren();const bindings=document.getElementById('bindings');bindings.replaceChildren();
  for(const d of controlDefs){
    const pos=draft[d.id],b=document.createElement('button');b.type='button';b.className='pad';b.textContent=d.icon;b.title=d.label;b.dataset.action=d.id;
    const place=()=>{b.style.left=pos.x+'%';b.style.top=pos.y+'%';};place();field.append(b);
    b.onpointerdown=e=>{if(drag)return;e.preventDefault();b.setPointerCapture(e.pointerId);drag={id:e.pointerId,button:b,x:e.clientX,y:e.clientY,oldX:pos.x,oldY:pos.y};};
    b.onpointermove=e=>{if(drag?.button!==b||drag.id!==e.pointerId)return;const r=field.getBoundingClientRect();
      pos.x=Math.max(7,Math.min(93,drag.oldX+(e.clientX-drag.x)*100/r.width));
      pos.y=Math.max(8,Math.min(92,drag.oldY+(e.clientY-drag.y)*100/r.height));place();};
    b.onlostpointercapture=()=>{if(drag?.button!==b)return;
      if(controlDefs.some(other=>other!==d && Math.abs(draft[other.id].x-pos.x)<13 && Math.abs(draft[other.id].y-pos.y)<14)){
        pos.x=drag.oldX;pos.y=drag.oldY;place();note.textContent='Deixe um espaço entre os botões.';
      }drag=null;};
    const key=document.createElement('button');key.type='button';key.className=capturing===d.id?'btn waiting':'btn';
    const cap=document.createElement('kbd');cap.textContent=capturing===d.id?'Aperte a tecla…':keyLabel(pos.key);
    key.textContent=d.label;key.append(cap);
    key.onclick=()=>{capturing=d.id;note.textContent='Nova tecla para '+d.label.toLowerCase()+'?';renderControls();};
    bindings.append(key);if(capturing===d.id)key.focus();

  }
}
dialog.addEventListener('keydown',e=>{
  if(!capturing || e.code==='Tab')return;
  e.preventDefault();e.stopPropagation();
  if(e.code==='Escape'){capturing=null;note.textContent='';renderControls();return;}
  if(draft.arrowFire && e.code.startsWith('Arrow')){note.textContent='Neste modo as setas controlam o tiro. Escolha outra tecla.';return;}
  if(!/^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Space|Shift(Left|Right))$/.test(e.code)){note.textContent='Escolha uma letra, número, seta, Shift ou Espaço.';return;}
  if(controlDefs.some(d=>d.id!==capturing && draft[d.id].key===e.code)){note.textContent='Essa tecla já está em uso.';return;}
  draft[capturing].key=e.code;capturing=null;note.textContent='Tecla alterada. Clique em Salvar para aplicar.';renderControls();
});
dialog.addEventListener('close',()=>{draft=null;capturing=null;drag=null;paused=wasPaused;});
function saveControls(){
  const clash=controlDefs.find(d=>draft.arrowFire && draft[d.id].key.startsWith('Arrow'));
  if(clash){capturing=clash.id;note.textContent='Escolha uma tecla para '+clash.label.toLowerCase()+'. As setas serão usadas para atirar.';renderControls();return;}
  gameSave.setItem(controlsKey,JSON.stringify(draft));controls=draft;refreshHints();if(!guide.hidden && level?.training)showTrainingGuide();dialog.close();}
function drawTouchPads(){
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 16px Courier New';
  for(const d of controlDefs){
    if(d.id==='fire'&&!level.isBoss)continue;
    const {x,y}=controls[d.id];ctx.fillStyle=touchHeld(d.id)?'#20644c':'rgba(18,30,27,.76)';
    ctx.fillRect(x*8-52,y*4.5-31.5,104,63);ctx.strokeStyle='#9acd9e';ctx.strokeRect(x*8-52,y*4.5-31.5,104,63);
    ctx.fillStyle='#fff3bd';ctx.fillText(d.icon,x*8,y*4.5);
  }ctx.restore();
}
function touchHandler(e){
  if(screen!=='playing'||dialog.open)return;
  if(!touchMode){touchMode=true;if(!guide.hidden && level?.training)showTrainingGuide();}e.preventDefault();
  for(const t of e.changedTouches){
    if(e.type==='touchend'||e.type==='touchcancel'){fingers.delete(t.identifier);continue;}
    const r=canvas.getBoundingClientRect(), x=100*(t.clientX-r.left-canvas.clientLeft)/canvas.clientWidth,y=100*(t.clientY-r.top-canvas.clientTop)/canvas.clientHeight;
    const hit=controlDefs.find(d=>(d.id!=='fire'||level.isBoss)&&Math.abs(controls[d.id].x-x)<=6.5 && Math.abs(controls[d.id].y-y)<=7);
    if(e.type==='touchmove'){if(['left','right'].includes(fingers.get(t.identifier))) {if(hit?.id==='left'||hit?.id==='right')fingers.set(t.identifier,hit.id);else fingers.delete(t.identifier);}continue;}
    if(!hit)continue;
    if(hit.id==='pause'){paused=!paused;fingers.clear();continue;}
    if(paused)continue;
    fingers.set(t.identifier,hit.id);
    if(hit.id==='jump'){player.jumpBuffer=6;if(!player.grounded&&level.isBoss)player.parryTimer=11;}
    if(hit.id==='dash')startDash();
    if(hit.id==='fire')tryPlayerShoot(false);
  }
}

['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(n => canvas.addEventListener(n, touchHandler, { passive: false }));

let vig = null;
function drawAmbient() {
  const ch = Math.floor(currentLevel / 20) % 5, T = Date.now() / 1000;
  for (let i = 0; i < 36; i++) {
    const sx = (i * 137.5) % 800, sy = (i * 89.3) % 420; let x = sx, y = sy, c, sz = 2;
    if (ch === 0) { x = sx + Math.sin(T + i) * 20; y = sy + Math.cos(T * 0.7 + i) * 14; c = 'rgba(255,240,140,' + (0.4 + 0.4 * Math.sin(T * 3 + i)) + ')'; }
    else if (ch === 1) { y = ((sy - T * 30 * (1 + i % 3 * 0.3)) % 450 + 450) % 450; x = sx + Math.sin(T + i) * 10; c = 'rgba(255,120,40,0.7)'; }
    else if (ch === 2) { c = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(T * 4 + i)) + ')'; sz = i % 4 === 0 ? 3 : 2; }
    else if (ch === 3) { y = (sy + T * 40 * (1 + i % 3 * 0.4)) % 450; x = sx + Math.sin(T * 0.8 + i) * 16; c = 'rgba(255,255,255,0.85)'; }
    else { y = ((sy - T * 18) % 450 + 450) % 450; x = sx + Math.sin(T * 1.3 + i) * 22; c = 'rgba(199,125,255,0.6)'; }
    ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), sz, sz);
  }
}

function glow(x, y, r, rgb) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 3; i >= 1; i--) { const rr = (r * i / 3) | 0; ctx.fillStyle = 'rgba(' + rgb + ',0.07)'; ctx.fillRect(Math.round(x - rr), Math.round(y - rr), rr * 2, rr * 2); }
  ctx.restore();
}
function drawParallax() {
  const T = Date.now() / 1000, ch = Math.floor(currentLevel / 20) % 5;
  ctx.save();
  if (ch === 0 || ch === 2 || ch === 3) { ctx.globalAlpha = 0.5; for (let i = 0; i < 5; i++) drawPixelCloud(ctx, ((i * 230 + T * (6 + i * 3)) % 1040) - 120, 24 + i * 26 + Math.sin(T * 0.4 + i) * 3, 2 + (i % 2)); }
  else { ctx.fillStyle = ch === 1 ? 'rgba(255,60,80,0.07)' : 'rgba(190,120,255,0.07)'; for (let i = 0; i < 4; i++) { const x = ((i * 260 + T * 14) % 1100) - 200; ctx.fillRect(x, 150 + i * 34, 360, 10); ctx.fillRect(x + 40, 160 + i * 34, 280, 8); } }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,230,160,0.035)';
  for (let i = 0; i < 4; i++) { const bx = 100 + i * 210 + Math.sin(T * 0.3 + i) * 20; for (let y = 0; y < 300; y += 6) ctx.fillRect(Math.round(bx + y * 0.5), y, 28, 6); }
  ctx.restore();
}

function drawNewHazards() {
  const T = Date.now(), biome = getBiomeForLevel(currentLevel);
  for (const p of level.platforms) {
    if (p.type !== 'solid' || p.fallen || p.w < 30) continue;
    for (let k = 0; k * 9 + 8 < p.w; k++) {
      const x = p.x + 4 + k * 9, h = 2 + ((k * 7 + 3) % 5), sw = Math.round(Math.sin(T * 0.003 + k));
      ctx.fillStyle = biome.grassMid; ctx.fillRect(x + sw, p.y - h, 2, h); ctx.fillStyle = biome.grassTop; ctx.fillRect(x + sw, p.y - h, 2, 1);
    }
  }
  let gy = null;
  for (const p of level.platforms) if (!p.fallen && player.x + player.w > p.x && player.x < p.x + p.w && p.y >= player.y + player.h - 2 && (gy === null || p.y < gy)) gy = p.y;
  if (gy !== null && deadTimer === 0) { const w = Math.max(6, 20 - (gy - player.y - player.h) * 0.1); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(Math.round(player.x + 10 - w / 2), gy - 1, Math.round(w), 3); }
  if (level.door && level.door.open) glow(level.door.x + 14, level.door.y + 22, 36, '255,209,102');
  if (level.keyItem && !level.keyItem.collected) glow(level.keyItem.x, level.keyItem.y, 26, '255,209,102');
  for (const c of level.crystals || []) if (c.t <= 0) glow(c.x, c.y, 22, '76,201,240');
  for (const v of level.vents || []) if (v.on) glow(v.x + 9, v.y - 30, 36, '255,120,40');
  for (const p of level.platforms) if (p.ice && !p.fallen) { ctx.fillStyle = 'rgba(190,245,255,0.6)'; ctx.fillRect(p.x, p.y, p.w, 4); ctx.fillStyle = '#fff'; ctx.fillRect(p.x + ((T / 40 + p.x) % Math.max(8, p.w - 8)), p.y + 1, 6, 2); }
  for (const v of level.vents || []) {
    ctx.fillStyle = '#140c07'; ctx.fillRect(v.x - 2, v.y - 6, v.w + 4, 8); ctx.fillStyle = '#6c757d'; ctx.fillRect(v.x, v.y - 5, v.w, 5);
    if (v.t >= 60 && v.t < 90) { ctx.fillStyle = 'rgba(255,158,0,' + (0.4 + 0.4 * Math.sin(T * 0.03)) + ')'; ctx.fillRect(v.x + 3, v.y - 12, v.w - 6, 6); }
    if (v.on) { const fl = Math.random() * 6 | 0; ctx.fillStyle = '#e63946'; ctx.fillRect(v.x, v.y - 70 + fl, v.w, 64 - fl); ctx.fillStyle = '#ff9e00'; ctx.fillRect(v.x + 3, v.y - 60 + fl, v.w - 6, 54 - fl); ctx.fillStyle = '#ffd166'; ctx.fillRect(v.x + 6, v.y - 45, v.w - 12, 40); }
  }
  for (const m of level.maces || []) {
    ctx.fillStyle='#313540';ctx.fillRect(m.ax-5,m.ay-4,10,8);
    ctx.save();ctx.translate(m.ax,m.ay);ctx.rotate(Math.atan2(m.by-m.ay,m.bx-m.ax)-Math.PI/2);
    for(let y=3;y<m.len-9;y+=7){ctx.strokeStyle='#1b2229';ctx.lineWidth=3;ctx.strokeRect(-2,y,4,6);ctx.strokeStyle='#b7bfc8';ctx.lineWidth=1;ctx.strokeRect(-2,y,4,6);}
    ctx.imageSmoothingEnabled=false;
    if(ironPicture.naturalWidth)ctx.drawImage(ironPicture,-14,m.len-14,28,28);
    else{ctx.fillStyle='#444';ctx.beginPath();ctx.arc(0,m.len,14,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  for (const c of level.crystals || []) {
    const bob = Math.sin(T * 0.005) * 3;
    ctx.fillStyle = c.t > 0 ? 'rgba(76,201,240,0.25)' : '#4cc9f0';
    for (let i = 0; i < 5; i++) { const w = 2 + i * 3; ctx.fillRect(c.x - w / 2, c.y - 10 + i * 2 + bob, w, 2); ctx.fillRect(c.x - w / 2, c.y + 8 - i * 2 + bob, w, 2); }
    if (c.t <= 0) { ctx.fillStyle = '#fff'; ctx.fillRect(c.x - 3, c.y - 4 + bob, 2, 2); }
  }
  drawAmbient();
}

function drawExtraHUD() {
  drawTrailSpeech();
  if (screen !== 'playing') return;
  ctx.save();
  ctx.font = 'bold 12px Courier New';
  ctx.textAlign = 'right';
  const txt = (levelTime / 60).toFixed(2) + 's' + (bestTime ? '  🏆 ' + bestTime.toFixed(2) + 's' : '');
  ctx.fillStyle = '#000'; ctx.fillText(txt, 787, 21);
  ctx.fillStyle = '#fff'; ctx.fillText(txt, 786, 20);
  if (!vig) { vig = ctx.createRadialGradient(400, 225, 200, 400, 225, 520); vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.45)'); }
  ctx.fillStyle = vig; ctx.fillRect(0, 0, 800, 450);
  if (!level.training && levelTime < 18) { ctx.fillStyle = 'rgba(0,0,0,' + (1 - levelTime / 18) + ')'; ctx.fillRect(0, 0, 800, 450); }
  if (enterDoorTimer > 0) { ctx.fillStyle = 'rgba(0,0,0,' + (0.25 + 0.55*(1-enterDoorTimer/resultFrames)) + ')'; ctx.fillRect(0, 0, 800, 450); }
  if (!deadTimer&&!enterDoorTimer&&!bossBannerTimer&&!paused&&!chestAnim.active&&!crateAnim.active) {
    ctx.save();ctx.font='bold 14px Courier New';ctx.textAlign='center';
    const task=objectiveText(),width=Math.min(750,ctx.measureText(task).width+26);
    const y=level.isBoss?99:19;
    ctx.fillStyle='#13222e';ctx.fillRect(400-width/2,y,width,23);
    ctx.fillStyle='#ffdf87';ctx.fillText(task,400,y+16,width-12);
    if(level.story && !level.story.until && levelTime<420){
      ctx.font='bold 11px Courier New';
      const clue=level.story.clue,w=Math.min(690,ctx.measureText(clue).width+16);
      ctx.fillStyle='#24232e';ctx.fillRect(400-w/2,y+24,w,15);
      ctx.fillStyle='#ffe4bd';ctx.fillText(clue,400,y+35,w-8);
    }
    ctx.restore();
  }
  ctx.textAlign='center';ctx.font='bold 11px Courier New';
  if (!touchMode) {drawBox(697,32,89,23,'#172c30',player.dashReady?'#65efdc':'#758184');
  ctx.fillStyle=player.dashReady?'#aaffef':'#c6c9c8';
  ctx.fillText(player.dashReady?'IMPULSO':'RECARREGANDO',741,47);}
  const [gold, silver] = starGoals(currentLevel);
  ctx.textAlign='left';ctx.fillStyle='#ffe185';
  if(!level.training)ctx.fillText('★★★ até '+gold+'s   ★★ até '+silver+'s',16,47);
  if (!level.training && currentLevel===0 && levelTime<300) {
    ctx.textAlign='center';ctx.fillText('No ar: '+(touchMode?'toque em Impulso':keyLabel(controls.dash.key))+' para avançar.',400,103);
  }
  if (enterDoorTimer > 0) {
    drawBox(242,154,316,134,'#19281f','#ffd166');
    ctx.textAlign='center';ctx.fillStyle='#fff2c8';ctx.font='bold 17px Courier New';
    ctx.fillText(level.isBoss?'FIO DO CHEFE ROMPIDO':'PASSAGEM RECUPERADA',400,184);
    ctx.fillStyle='#ffd166';ctx.font='bold 34px sans-serif';
    ctx.fillText('★'.repeat(finishStars)+'☆'.repeat(3-finishStars),400,229);
    ctx.font='bold 13px Courier New';
    ctx.fillText('Tempo: '+(levelTime/60).toFixed(2).replace('.',',')+' s',400,261);
  }
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(0, 0, 800, 450);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 34px Courier New'; ctx.fillText('⏸ PAUSADO', 400, 215);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Courier New';
    ctx.fillText((touchMode?'Pausa':keyLabel(controls.pause.key))+' para continuar  •  Esc: portais', 400, 246);
  }
  ctx.restore();
}

function draw() {
  if (screen === 'title') drawTitleScreen();
  else if (screen === 'map') drawMapScreen();
  else if (screen === 'shop') drawShopScreen();
  else if (screen === 'weapons') drawWeaponsScreen();
  else if (screen === 'pets') drawPetsScreen();
  else if (screen === 'playing') drawPlaying();
  drawOverlays();
  drawExtraHUD();
  if(touchMode && screen==='playing')drawTouchPads();
}

// =========================================================================
// TRAVA FIXA DE 60 FPS
// =========================================================================
let lastFrameTime=0,simulationLag=0;
const FRAME_INTERVAL=1000/60;
function loop(timestamp){
  requestAnimationFrame(loop);
  if(document.getElementById('opening')){lastFrameTime=timestamp;return;}
  if(!lastFrameTime)lastFrameTime=timestamp;
  simulationLag+=Math.min(80,timestamp-lastFrameTime);lastFrameTime=timestamp;
  while(simulationLag>=FRAME_INTERVAL){update();simulationLag-=FRAME_INTERVAL;}
  draw();
}
// =========================================================================
// CONTROLES DE CLIQUE NO CANVAS
// =========================================================================
canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left - canvas.clientLeft) * (canvas.width / canvas.clientWidth);
  const my = (e.clientY - rect.top - canvas.clientTop) * (canvas.height / canvas.clientHeight);
  mouse.x = mx;
  mouse.y = my;
  mouse.active = true;
  mouse.down = true;

  if (chestAnim.active) {
    if (chestAnim.timer < chestAnim.maxTimer - 55) { chestAnim.active = false; sfxClick(); }
    return;
  }
  if (crateAnim.active) {
    if (crateAnim.timer < crateAnim.maxTimer - 40) { crateAnim.active = false; sfxClick(); }
    return;
  }

  if (screen === 'playing') {
    tryPlayerShoot(true);
    return;
  }

  if (screen === 'title') {
    if (mx >= 265 && mx <= 535 && my >= 294 && my <= 340) goMap();
    else if (mx >= 265 && mx <= 535 && my >= 350 && my <= 384) goShop();
  } else if (screen === 'map') {
    if (mx >= 55 && mx <= 125 && my >= 26 && my <= 54) { changeMapPage(-1); return; }
    if (mx >= 675 && mx <= 745 && my >= 26 && my <= 54) { changeMapPage(1); return; }

    const startLvl = mapPage * 20;
    if (mx >= 660 && mx <= 748 && my >= 145 && my <= 295) {
      if ((unlockedLevel >= startLvl + 20 || (startLvl+20===TOTAL_LEVELS && stageStars[TOTAL_LEVELS-1])) && !openedChests.includes(mapPage)) openChest(mapPage);
      return;
    }

    for (let i = 0; i < 20; i++) {
      const lvlIdx = startLvl + i;
      const col = i % 5;
      const row = Math.floor(i / 5);
      const bx = 72 + col * 116;
      const by = 72 + row * 84;
      if (mx >= bx && mx <= bx + 98 && my >= by && my <= by + 68) {
        if (lvlIdx <= unlockedLevel) promptStartLevel(lvlIdx);
        else playTone(130, 'sawtooth', 0.12, 0.08);
        return;
      }
    }
  } else if (screen === 'shop') {
    if(my>=68 && my<=100){
      if(mx>=205 && mx<=385){shopTab='weapons';sfxClick();return;}
      if(mx>=415 && mx<=595){shopTab='pets';sfxClick();return;}
    }
    for (let idx = 0; idx < 4; idx++) {
      const bx = 62 + idx * 172;
      const by = 122;
      if (mx >= bx && mx <= bx + 158 && my >= by && my <= by + 265) {
        if (shopTab === 'weapons') buyWeaponCrate(idx);
        else buyPetEgg(idx);
        return;
      }
    }
  } else if (screen === 'weapons') {
    if (mx >= 260 && mx <= 340 && my >= 384 && my <= 412) { changeWepPage(-1); return; }
    if (mx >= 460 && mx <= 540 && my >= 384 && my <= 412) { changeWepPage(1); return; }

    const startIdx = wepPage * 8;
    for (let i = 0; i < 8; i++) {
      const wId = startIdx + i;
      if (wId >= WEAPONS.length) break;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = 65 + col * 342;
      const by = 74 + row * 74;
      if (mx >= bx && mx <= bx + 326 && my >= by && my <= by + 62) {
        if (ownedWeapons.includes(wId)) {
          equippedWeaponId = wId;
          saveAllData();
          updateUI();
          sfxClick();
        } else {
          playTone(130, 'sawtooth', 0.12, 0.08);
        }
        return;
      }
    }
  } else if (screen === 'pets') {
    for (let i = 0; i < PETS.length; i++) {
      const col = i % 2;
      
      const bx = 65 + col * 342;
      const by = petCardY(i);
      if (mx >= bx && mx <= bx + 326 && my >= by && my <= by + 49) {
        if (ownedPets.includes(i)) {
          equippedPetId = (equippedPetId === i) ? -1 : i;
          saveAllData();
          updateUI();
          sfxClick();
        } else {
          playTone(130, 'sawtooth', 0.12, 0.08);
        }
        return;
      }
    }
  }
});


const PET_ART = [
  { r: ['..kk..kk..','kakkkkkkak','kaaaaaaaak','kaeaaaaeak','kaaaccaaak','kabbbbbbak','.kbbbbbbk.','..kk..kk..'], a: '#8d5524', b: '#c68642', c: '#ff758f' },
  { r: ['k.kk..kk.k','kakaaaakak','kaaaaaaaak','kaeaaaaeak','kabbbbbbak','kabbccbbak','.kbbbbbbk.','..kk..kk..'], a: '#ffd166', b: '#ffffff', c: '#140c07' },
  { r: ['..kkkkkk..','.kaaaaaak.','kceaaaaeck','kaaaaaaaak','kabbbbbbak','kaaaaaaaak','.kaaaaaak.','..kk..kk..'], a: '#38b000', b: '#e63946', c: '#ffffff' },
  { r: ['..k....k..','ckbk..kbk.','cckbbbbbkk','ccbebbbebk','cckbbppbbk','ccckbbbbk.','..kkkkkk..','..........'], a: '#ff8fa3', b: '#adb5bd', c: '#e63946' },
  { r: ['..kk..kk..','.kaakkaak.','kaaaaaaaak','kaeaaaaeak','kaaakkaaak','kabaaaabak','kabbbbbbak','.kkkkkkkk.'], a: '#ffd166', b: '#e0a800', c: '#fff' },
  { r: ['....kk....','...kaak...','kkkaaaakkk','kaaaeaaaak','kabbbbbbak','kbbbbbbbbk','.kk.kk.kk.','rr.rr.rr..'], a: '#4a6fa5', b: '#cfe0f5', c: '#fff' },
  { r: ['.kkkkkkkk.','kabbbbbbak','kaaaaaaaak','kaeaaaaeak','kaaaaaaaak','kaawwwwaak','kabbbbbbak','.kkkkkkkk.'], a: '#8d5524', b: '#6f4518', c: '#fff' },
  { r: ['..kkkkkk..','.kbbbbbbk.','kbebbbebbk','kbbbrrbbbk','kkbbbbbbkk','kaaaaaaaak','kaaaaaaaak','.kkkkkkkk.'], a: '#e5e5e5', b: '#f1c27d', c: '#fff' }
];
const _basePet = drawPetSprite;
drawPetSprite = function (c, cx, cy, pet, scale = 1) {
  if (pet?.spriteKey) {
    const img = _customImgs[pet.spriteKey];
    if (img?.naturalWidth) {
      const ratio = 25 * scale / Math.max(img.naturalWidth, img.naturalHeight);
      const w = img.naturalWidth * ratio, h = img.naturalHeight * ratio;
      c.save(); c.imageSmoothingEnabled = false;
      c.drawImage(img, Math.round(cx - w/2), Math.round(cy - h/2), w, h); c.restore();
    }
    return;
  }
  const art = pet && PET_ART[pet.id];
  if (!art) return _basePet(c, cx, cy, pet, scale);
  const pal = { k: '#140c07', e: '#140c07', w: '#ffffff', r: '#e63946', p: '#ff8fa3', a: art.a, b: art.b, c: art.c }, u = 2 * scale;
  c.save(); c.translate(Math.round(cx), Math.round(cy + Math.sin(Date.now() * 0.006) * scale));
  art.r.forEach((row, j) => { for (let i = 0; i < 10; i++) { const ch = row[i]; if (ch !== '.') { c.fillStyle = pal[ch] || '#fff'; c.fillRect(Math.round((i - 5) * u), Math.round((j - 4) * u), Math.ceil(u), Math.ceil(u)); } } });
  c.restore();
};

const MEME_OVER = {
  'Sigma': c => { c.fillStyle = '#140c07'; c.fillRect(-7, -25, 14, 4); c.fillStyle = '#fff'; c.fillRect(-5, -24, 2, 1); },
  'Gigachad': c => { c.fillStyle = '#140c07'; c.fillRect(-7, -25, 14, 3); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-6, -18, 12, 2); },
  'Doge': c => { c.fillStyle = '#ffd166'; c.fillRect(-7, -33, 3, 5); c.fillRect(4, -33, 3, 5); },
  'Cheems': c => { c.fillStyle = '#e0a800'; c.fillRect(-7, -33, 3, 5); c.fillRect(4, -33, 3, 5); },
  'Pepe': c => { c.fillStyle = '#38b000'; c.fillRect(-6, -29, 12, 11); c.fillStyle = '#fff'; c.fillRect(-5, -26, 4, 4); c.fillRect(1, -26, 4, 4); c.fillStyle = '#140c07'; c.fillRect(-3, -25, 2, 2); c.fillRect(3, -25, 2, 2); },
  'Tung Tung': c => { c.fillStyle = '#140c07'; c.fillRect(8, -32, 5, 26); c.fillStyle = '#c9a26b'; c.fillRect(9, -31, 3, 24); },
  'Skibidi': c => { c.fillStyle = '#140c07'; c.fillRect(-9, -35, 18, 6); c.fillStyle = '#e5e5e5'; c.fillRect(-8, -34, 16, 4); },
  'Nyan': c => { ['#e63946', '#ff9e00', '#ffd166', '#70e000', '#4cc9f0', '#7209b7'].forEach((k, i) => { c.fillStyle = k; c.fillRect(-26, -22 + i * 3, 18, 3); }); },
  'Rickroll': c => { c.fillStyle = '#e07a5f'; c.fillRect(-6, -35, 12, 6); },
  'Capivara': c => { c.fillStyle = '#8d5524'; c.fillRect(-7, -31, 3, 4); c.fillRect(4, -31, 3, 4); },
  'Brainrot': c => { c.fillStyle = '#e63946'; c.fillRect(-5, -24, 3, 3); c.fillRect(2, -24, 3, 3); },
  'Faustão': c => { c.fillStyle = '#140c07'; c.fillRect(-7, -34, 14, 4); },
  'Chaves': c => { c.fillStyle = '#e63946'; c.fillRect(-7, -34, 14, 5); c.fillStyle = '#ffd166'; c.fillRect(-7, -30, 14, 1); },
  'Mewing': c => { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-6, -19, 12, 2); },
  'Bombardiro': c => { c.fillStyle = '#6c757d'; c.fillRect(-12, -35, 24, 3); },
  'Tralalero': c => { c.fillStyle = '#4a6fa5'; c.fillRect(-2, -37, 4, 7); },
  'Ballerina': c => { c.fillStyle = '#ff8fa3'; c.fillRect(-9, -9, 18, 3); },
  'Sus': c => { c.fillStyle = '#e63946'; c.fillRect(-7, -22, 14, 6); c.fillStyle = '#90e0ef'; c.fillRect(-1, -22, 7, 3); },
  'Pedro Pedro': c => { c.fillStyle = '#6c757d'; c.fillRect(-7, -33, 14, 3); c.fillRect(-9, -31, 18, 2); },
  'Rizzler': c => { c.fillStyle = '#ff007f'; c.fillRect(-5, -20, 10, 2); }
};
const _baseSkin = drawSkinCharacter;
drawSkinCharacter = function (c, x, y, w, h, skin, facing = 1, walk = 0, sqX = 1, sqY = 1, aim = null) {
  _baseSkin(c, x, y, w, h, skin, facing, walk, sqX, sqY, aim);
  const fn = null; if (!fn) return;
  c.save(); c.translate(x + w / 2, y + h); c.scale(facing * sqX, sqY); fn(c); c.restore();
};

function outlineWrap(fn) {
  return function (c, ...a) {
    fn(c, ...a);
  };
}
drawPetSprite = outlineWrap(drawPetSprite);
drawWeaponIcon = outlineWrap(drawWeaponIcon);

function fitCanvas() {
  const sc = Math.min(3, (innerWidth - 24) / 816, (innerHeight - (guide.hidden?100:guide.offsetHeight+document.querySelector('.top-bar').offsetHeight+32)) / 466);
  const k = sc >= 2 ? Math.floor(sc * 4) / 4 : sc;
  canvas.style.width = Math.round(800 * k + 16) + 'px';
  canvas.style.height = Math.round(450 * k + 16) + 'px';
  document.querySelector('.top-bar').style.width = Math.round(800 * k + 16) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();
refreshHints();
updateUI();
requestAnimationFrame(loop);

function buildSprite(skin, frame) {
  const key = skin.id + '_' + frame;
  if (_sprCache[key]) return _sprCache[key];
  const T = SPR[skin.tpl] || SPR.GEN;
  const pal = Object.assign({ c: skin.suit, a: skin.accent, s: skin.skinTone, h: skin.hair || '#4a2e1b' }, T.pal);
  if (T === SPR.GEN || T === SPR.KID) { pal.h = skin.hair || '#4a2e1b'; pal.s = skin.skinTone; pal.c = skin.suit; }
  let g = T.r.map(s => s.split(''));
  if (frame === 1) {
    const H0 = g.length;
    for (let y = H0 - 4; y < H0; y++) {
      const n = new Array(16).fill('.');
      for (let x = 0; x < 16; x++) { if (g[y][x] === '.') continue; const nx = x < 8 ? x + 1 : x - 1; n[nx] = g[y][x]; }
      g[y] = n;
    }
  }
  const H = g.length, cv = document.createElement('canvas');
  cv.width = 18; cv.height = H + 2;
  const q = cv.getContext('2d');
  const at = (x, y) => (x < 0 || y < 0 || x > 15 || y >= H) ? '.' : g[y][x];
  for (let y = -1; y <= H; y++) for (let x = -1; x <= 16; x++) {
    const ch = at(x, y);
    if (ch === '.') {
      if (at(x - 1, y) !== '.' || at(x + 1, y) !== '.' || at(x, y - 1) !== '.' || at(x, y + 1) !== '.') { q.fillStyle = '#140c07'; q.fillRect(x + 1, y + 1, 1, 1); }
      continue;
    }
    q.fillStyle = pal[ch] || '#ff00ff'; q.fillRect(x + 1, y + 1, 1, 1);
    if (ch === 'k' || ch === 'w') continue;
    if (at(x, y - 1) === '.' || at(x - 1, y) === '.') { q.fillStyle = 'rgba(255,255,255,0.28)'; q.fillRect(x + 1, y + 1, 1, 1); }
    if (at(x, y + 1) === '.' || at(x + 1, y) === '.') { q.fillStyle = 'rgba(0,0,0,0.32)'; q.fillRect(x + 1, y + 1, 1, 1); }
    else if (((x + y) & 1) && at(x, y + 2) === '.') { q.fillStyle = 'rgba(0,0,0,0.14)'; q.fillRect(x + 1, y + 1, 1, 1); }
  }
  return (_sprCache[key] = cv);
}
function drawSkinCharacter(c, x, y, w, h, skin, facing = 1, walkAnim = 0, sqX = 1, sqY = 1, aimAngle = null) {
  let bob=0;
  if(skin.customHero){
    drawHero(c,x+w/2,y+h,facing*sqX,sqY,walkAnim,aimAngle===null?0:1);
  }else{
  const S = 2;
  const isCustom = !!(skin.tpl && _customImgs[skin.tpl] && _customImgs[skin.tpl].complete && _customImgs[skin.tpl].naturalWidth);
  const isTung = (skin.tpl === 'TUNG' && _tungImg.complete && _tungImg.naturalWidth);
  const IMG = isTung ? _tungImg : (isCustom ? _customImgs[skin.tpl] : null);
  const spr = IMG || buildSprite(skin, walkAnim > 0 && Math.sin(walkAnim) > 0 ? 1 : 0);

  let K = S;
  if (isTung) K = 0.72;
  else if (isCustom) K = 38 / spr.height;

  const mv = walkAnim > 0;
  const stepWave = mv ? Math.sin(walkAnim * 1.35) : 0;
  bob = mv ? Math.round(Math.abs(Math.sin(walkAnim * 1.35)) * 3) : 0;
  const sw = spr.width * K, sh = spr.height * K, ty = -sh + (IMG ? 0 : S) - bob;

  c.save();
  c.translate(x + w / 2, y + h);

  // Sombra realista no chão (camada externa difusa + núcleo escuro nos pés)
  const shadowScale = mv ? (1 - Math.abs(stepWave) * 0.14) : 1;
  c.fillStyle = 'rgba(0, 0, 0, 0.20)';
  c.beginPath();
  c.ellipse(0, 0, Math.max(8, sw * 0.48) * sqX * shadowScale, 4.2, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(0, 0, 0, 0.42)';
  c.beginPath();
  c.ellipse(0, 0, Math.max(5, sw * 0.30) * sqX * shadowScale, 2.2, 0, 0, Math.PI * 2);
  c.fill();

  c.scale(facing * sqX, sqY);
  c.imageSmoothingEnabled = false;

  if (IMG) {
    const t = Date.now() / 1000;
    // Inclinação para frente ao correr + balanço dinâmico de passo + respiração quando parado
    const forwardLean = mv ? 0.11 : 0;
    const strideTilt = mv ? stepWave * 0.14 : Math.sin(t * 2.1) * 0.025;
    const rot = forwardLean + strideTilt;
    const squashWalkX = mv ? (1 + Math.abs(stepWave) * 0.05) : (1 - Math.sin(t * 3.4) * 0.02);
    const squashWalkY = mv ? (1 - Math.abs(stepWave) * 0.04) : (1 + Math.sin(t * 3.4) * 0.025);
    const flipX = isTung ? -1 : 1;

    c.save();
    c.translate(0, -bob);
    c.rotate(rot);
    c.scale(flipX * squashWalkX, squashWalkY);

    if (mv) {
      // Animação articulada em 2 partes: tronco superior inclina e pernas/pés alternam o passo
      const splitY = Math.floor(spr.height * 0.68);
      const dstSplitY = -sh + splitY * K;
      const upperH = splitY * K;
      const lowerH = sh - upperH;
      const strideOffset = stepWave * 2.4;

      // Parte inferior (pernas/pés deslizando em passada alternada)
      c.drawImage(IMG, 0, splitY, spr.width, spr.height - splitY, -sw / 2 + strideOffset, dstSplitY, sw, lowerH);
      // Parte superior (tronco e cabeça com leve contra-balanço)
      c.drawImage(IMG, 0, 0, spr.width, splitY, -sw / 2 - strideOffset * 0.35, -sh, sw, upperH + 0.5);
    } else {
      c.drawImage(IMG, -sw / 2, -sh, sw, sh);
    }

    // Sombreamento direcional suave no sprite (luz vindo de cima/frente, sombra nas costas e base)
    c.globalCompositeOperation = 'source-atop';
    const shGrad = c.createLinearGradient(sw / 2, -sh, -sw / 2, 0);
    shGrad.addColorStop(0, 'rgba(255, 250, 225, 0.15)');
    shGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    shGrad.addColorStop(1, 'rgba(8, 6, 14, 0.30)');
    c.fillStyle = shGrad;
    c.fillRect(-sw / 2 - 4, -sh - 2, sw + 8, sh + 4);
    c.globalCompositeOperation = 'source-over';
    c.restore();
  } else {
    c.save();
    if (mv) {
      c.translate(0, -bob);
      c.rotate(0.08 + stepWave * 0.12);
    }
    c.drawImage(spr, -sw / 2, mv ? -sh : ty, sw, sh);
    // Sombreamento direcional 16-bit no personagem padrão
    const drawTop = mv ? -sh : ty;
    c.fillStyle = 'rgba(0, 0, 0, 0.22)';
    c.fillRect(-sw / 2 + 2, drawTop + sh * 0.45, 3, sh * 0.45);
    c.fillStyle = 'rgba(255, 255, 255, 0.16)';
    c.fillRect(sw / 2 - 5, drawTop + 3, 2, sh * 0.4);
    c.restore();
  }
  c.restore();

  }
  if (aimAngle !== null && screen === 'playing') {
    const wep = getActiveWeapon();
    const rec = Math.round(weaponRecoil);
    c.save();
    c.translate(x + w / 2, y + 14 + bob);
    c.rotate(aimAngle);
    if (Math.cos(aimAngle) < 0) c.scale(1, -1);

    drawDetailedWeaponShape(c, wep, 8 - rec, 0, 1.0);

    if (muzzleFlashTimer > 0) {
      c.save(); c.translate(28 - rec, -2);
      drawShotEffect(c, wep.id, 4 - muzzleFlashTimer, true);
      c.restore();
    }
    c.restore();

    if (shootCooldown > 0) {
      const ratio = 1 - (shootCooldown / wep.cooldown);
      c.fillStyle = '#140c07';
      c.fillRect(x - 1, y - 9, w + 2, 4);
      c.fillStyle = wep.bulletColor;
      c.fillRect(x, y - 8, Math.round(w * ratio), 2);
    }
  }
}

function drawPlatformBlock(p, biome) {
  if (p.fallen) return;
  if(p.type==='solid'){paintTerrain(ctx,p,level.isBoss?5:level.training?0:Math.floor(currentLevel/20)%5);return;}
  ctx.save();

  if (p.type === 'blink') {
    const cycle = p.blinkTimer % 180;
    const solid = cycle < 110;
    if (!solid) {
      ctx.strokeStyle = '#90e0ef';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.restore();
      return;
    }
    if (cycle > 85 && Math.floor(cycle / 3) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#00bbf9';
    ctx.fillRect(p.x + 2, p.y + 6, p.w - 4, p.h - 8);
    ctx.fillStyle = '#80ffdb';
    ctx.fillRect(p.x, p.y, p.w, 5);
    ctx.restore();
    return;
  }

  if (p.type === 'crumble' && p.crumbleTimer > 0) {
    ctx.translate((Math.random() - 0.5) * 3, 0);
  }

  if (p.type === 'moving') {
    ctx.fillStyle = '#140c07';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(p.x + 4, p.y + 3, p.w - 8, 3);
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(p.x + 6, p.y + 8, 6, 6);
    ctx.fillRect(p.x + p.w - 12, p.y + 8, 6, 6);
    ctx.restore();
    return;
  }

  ctx.fillStyle = '#140c07';
  ctx.fillRect(p.x - 1, p.y - 1, p.w + 2, p.h + 2);
  ctx.fillStyle = biome.dirtBase;
  ctx.fillRect(p.x, p.y, p.w, p.h);

  for (let bx = p.x + 4; bx < p.x + p.w - 6; bx += 12) {
    for (let by = p.y + 13; by < p.y + p.h - 6; by += 12) {
      const hash = ((bx * 17 + by * 31) % 11);
      if (hash < 4) {
        ctx.fillStyle = biome.dirtMid;
        ctx.fillRect(bx, by, 6, 6);
        ctx.fillStyle = biome.dirtDark;
        ctx.fillRect(bx + 2, by + 2, 4, 4);
      } else if (hash < 7) {
        ctx.fillStyle = biome.dirtLight;
        ctx.fillRect(bx + 1, by + 1, 4, 3);
      } else if (hash === 9) {
        ctx.fillStyle = '#140c07';
        ctx.fillRect(bx, by, 5, 5);
        ctx.fillStyle = biome.oreColor;
        ctx.fillRect(bx + 1, by + 1, 3, 3);
      }
    }
  }

  ctx.fillStyle = biome.grassDark;
  ctx.fillRect(p.x, p.y, p.w, 10);
  ctx.fillStyle = biome.grassMid;
  ctx.fillRect(p.x, p.y, p.w, 7);
  ctx.fillStyle = biome.grassTop;
  ctx.fillRect(p.x, p.y, p.w, 3);

  for (let gx = p.x + 2; gx < p.x + p.w - 4; gx += 6) {
    const drop = (gx * 7) % 5;
    ctx.fillStyle = biome.grassMid;
    ctx.fillRect(gx, p.y + 7, 3, drop);
    ctx.fillStyle = biome.grassDark;
    ctx.fillRect(gx, p.y + 7 + drop, 3, 2);
  }

  if (p.type === 'crumble') {
    ctx.fillStyle = '#140c07';
    for (let cx = p.x + 12; cx < p.x + p.w - 12; cx += 20) {
      ctx.fillRect(cx, p.y + 4, 3, 6);
      ctx.fillRect(cx + 2, p.y + 10, 3, 6);
    }
  }
  ctx.restore();
}

// =========================================================================
// ARTE PIXEL ART DO CHEFE 1 E DO SEGUNDO CHEFE "MOGGER" (1000 HP)
// =========================================================================
function drawPixelCircle(c, cx, cy, r, step = 4) {
  for (let yy = -r; yy <= r; yy += step) {
    for (let xx = -r; xx <= r; xx += step) {
      if (xx * xx + yy * yy <= r * r) {
        c.fillRect(cx + xx, cy + yy, step, step);
      }
    }
  }
}

function drawMoggerBoss(b) {
  ctx.save();
  const cx = Math.round(b.x + b.w / 2);
  const cy = Math.round(b.y + b.h / 2);
  const isHurt = b.hurtTimer > 0;
  const facing = (player.x + 10) >= cx ? 1 : -1;

  // Aviso no chão antes do soco gigante do braço
  if (b.state === 'arm_windup' && b.armPunch.active) {
    const dir = b.armPunch.dir;
    const warnX = dir > 0 ? cx + 24 : cx - 284;
    ctx.fillStyle = 'rgba(230, 57, 70, 0.35)';
    ctx.fillRect(warnX, b.armPunch.y - 18, 260, 36);
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = 2;
    ctx.strokeRect(warnX, b.armPunch.y - 18, 260, 36);
  }

  // Braço gigante esticado atacando o jogador
  if (b.state === 'arm_punch' && b.armPunch.active && b.armPunch.progress > 0.05) {
    const dir = b.armPunch.dir;
    const reach = Math.round(b.armPunch.progress * 260);
    const armStartX = cx + dir * 22;
    const armX = dir > 0 ? armStartX : armStartX - reach;
    const ay = Math.round(b.armPunch.y - 16);

    ctx.fillStyle = '#0b0c0e';
    ctx.fillRect(armX - 2, ay - 2, reach + 4, 36);
    ctx.fillStyle = isHurt ? '#ffffff' : '#6c757d';
    ctx.fillRect(armX, ay, reach, 32);
    ctx.fillStyle = isHurt ? '#ffffff' : '#adb5bd';
    ctx.fillRect(armX, ay + 3, reach, 10);
    // Punho cerrado enorme na ponta
    const fistX = dir > 0 ? armStartX + reach - 28 : armStartX - reach;
    ctx.fillStyle = '#0b0c0e';
    ctx.fillRect(fistX - 2, ay - 6, 32, 44);
    ctx.fillStyle = isHurt ? '#ffffff' : '#ced4da';
    ctx.fillRect(fistX, ay - 4, 28, 40);
    ctx.fillStyle = '#495057';
    ctx.fillRect(fistX + 4, ay + 8, 20, 3);
    ctx.fillRect(fistX + 4, ay + 18, 20, 3);
  }

  if (!b.chinStrokeTimer && paintBoss('mogger',b,b.x,b.y,facing)) {ctx.restore();return;}
  ctx.translate(cx, cy);
  ctx.scale(facing, 1);

  const skinDark = isHurt ? '#e5e5e5' : '#495057';
  const skinMid = isHurt ? '#ffffff' : '#8d99ae';
  const skinLight = isHurt ? '#ffffff' : '#dee2e6';
  const hairCol = isHurt ? '#adb5bd' : '#1b1d21';
  const outline = '#08090a';

  // Aura de sigma / mogger durante a pose
  if (b.chinStrokeTimer > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    drawPixelCircle(ctx, 0, -10, 78 + Math.sin(Date.now() * 0.03) * 6, 3);
  }

  // Pernas musculosas e calça escura
  ctx.fillStyle = outline;
  ctx.fillRect(-24, 34, 20, 46);
  ctx.fillRect(4, 34, 20, 46);
  ctx.fillStyle = '#212529';
  ctx.fillRect(-22, 36, 16, 42);
  ctx.fillRect(6, 36, 16, 42);

  // Tronco largo e definido (peitoral monocromático)
  ctx.fillStyle = outline;
  ctx.fillRect(-34, -22, 68, 58);
  ctx.fillStyle = skinDark;
  ctx.fillRect(-32, -20, 64, 54);
  ctx.fillStyle = skinMid;
  ctx.fillRect(-28, -18, 56, 30);
  // Definição do peitoral e abdômen
  ctx.fillStyle = skinLight;
  ctx.fillRect(-24, -14, 20, 12);
  ctx.fillRect(4, -14, 20, 12);
  ctx.fillRect(-14, 4, 10, 8);
  ctx.fillRect(4, 4, 10, 8);
  ctx.fillRect(-14, 16, 10, 8);
  ctx.fillRect(4, 16, 10, 8);

  // Braço traseiro
  ctx.fillStyle = outline;
  ctx.fillRect(-46, -18, 14, 46);
  ctx.fillStyle = skinMid;
  ctx.fillRect(-44, -16, 10, 42);

  // Pescoço grosso
  ctx.fillStyle = outline;
  ctx.fillRect(-16, -34, 32, 14);
  ctx.fillStyle = skinMid;
  ctx.fillRect(-14, -32, 28, 12);

  // Cabeça com maxilar extremamente quadrado e definido
  ctx.fillStyle = outline;
  ctx.fillRect(-24, -74, 48, 44);
  ctx.fillStyle = skinMid;
  ctx.fillRect(-22, -72, 44, 40);
  ctx.fillStyle = skinLight;
  ctx.fillRect(-18, -68, 34, 16);

  // Cabelo penteado para trás
  ctx.fillStyle = hairCol;
  ctx.fillRect(-24, -78, 46, 12);
  ctx.fillRect(-26, -70, 6, 18);
  ctx.fillStyle = '#495057';
  ctx.fillRect(-16, -76, 28, 3);

  // Sobrancelha marcada e olhar intenso
  ctx.fillStyle = outline;
  ctx.fillRect(2, -58, 18, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(6, -53, 6, 4);
  ctx.fillStyle = outline;
  ctx.fillRect(9, -53, 3, 4);

  // Nariz esculpido
  ctx.fillStyle = skinLight;
  ctx.fillRect(14, -52, 6, 12);
  ctx.fillStyle = skinDark;
  ctx.fillRect(12, -42, 6, 3);

  // Barba marcada no maxilar quadrado
  ctx.fillStyle = hairCol;
  ctx.fillRect(-20, -48, 8, 16);
  ctx.fillRect(-18, -36, 40, 8);
  ctx.fillRect(18, -42, 6, 12);

  // Sorriso branco brilhante ("GigaChad / Mogger smile")
  ctx.fillStyle = outline;
  ctx.fillRect(2, -42, 18, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(4, -41, 14, 5);
  ctx.fillStyle = '#adb5bd';
  ctx.fillRect(8, -41, 1, 5);
  ctx.fillRect(12, -41, 1, 5);

  // Brilho ("Bling") nos dentes quando ele passa a mão no queixo
  if (b.chinStrokeTimer > 0) {
    const spark = Math.round(Math.sin(Date.now() * 0.04) * 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, -45 - spark, 2, 10 + spark * 2);
    ctx.fillRect(10 - spark, -41, 10 + spark * 2, 2);
  }

  // Braço frontal: se estiver "Moggando", leva a mão ao queixo!
  if (b.chinStrokeTimer > 0) {
    ctx.fillStyle = outline;
    ctx.fillRect(26, -20, 16, 26);
    ctx.fillRect(14, -38, 22, 14);
    ctx.fillStyle = skinLight;
    ctx.fillRect(28, -18, 12, 22);
    ctx.fillRect(16, -36, 18, 10);
    // Dedos no queixo quadrado
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, -35, 6, 8);
  } else if (b.state !== 'arm_punch') {
    ctx.fillStyle = outline;
    ctx.fillRect(32, -18, 16, 48);
    ctx.fillStyle = skinLight;
    ctx.fillRect(34, -16, 12, 44);
  }

  ctx.restore();
}

function drawBossEntity(b) {
  if(b.training){paintTrainingDrone(b);return;}
  if (b.meme) { drawMemeBoss(b); return; }
  if (b.bossType === 'mogger') {
    drawMoggerBoss(b);
    return;
  }

  ctx.save();
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  ctx.translate(cx, cy);

  if ((b.phase === 1 || b.phase === 2) && b.state === 'slam_warn') {
    ctx.fillStyle = 'rgba(230, 57, 70, 0.35)';
    ctx.fillRect(-b.w / 2, b.h / 2, b.w, 300 - (b.y + b.h));
  }

  const isHurt = b.hurtTimer > 0;

  if (b.phase === 1 || b.phase === 2) {
    const r = 36;
    ctx.fillStyle = '#140c07';
    drawPixelCircle(ctx, 0, 0, r + 4, 3);
    ctx.fillStyle = isHurt ? '#ffffff' : '#d48c00';
    drawPixelCircle(ctx, 0, 0, r, 3);
    ctx.fillStyle = isHurt ? '#ffffff' : '#ffd000';
    drawPixelCircle(ctx, -2, -2, r - 3, 3);
    ctx.fillStyle = isHurt ? '#ffffff' : '#fff3b0';
    drawPixelCircle(ctx, -12, -14, 10, 3);

    ctx.fillStyle = '#0b090a';
    ctx.fillRect(-14, -14, 8, 14);
    ctx.fillRect(6, -14, 8, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-12, -12, 3, 4);
    ctx.fillRect(8, -12, 3, 4);

    if (b.phase === 1) {
      ctx.fillStyle = '#0b090a';
      ctx.fillRect(-22, 4, 4, 4);
      ctx.fillRect(18, 4, 4, 4);
      ctx.fillRect(-20, 6, 4, 6);
      ctx.fillRect(16, 6, 4, 6);
      ctx.fillRect(-16, 10, 6, 4);
      ctx.fillRect(10, 10, 6, 4);
      ctx.fillRect(-10, 13, 20, 4);
    } else {
      ctx.fillStyle = '#0b090a';
      ctx.fillRect(-24, 2, 48, 12);
      ctx.fillRect(-20, 14, 40, 8);
      ctx.fillRect(-14, 22, 28, 4);
      ctx.fillRect(-26, -2, 4, 8);
      ctx.fillRect(22, -2, 4, 8);
      ctx.fillStyle = '#ffffff';
      for (let tx = -20; tx <= 16; tx += 6) ctx.fillRect(tx, 4, 4, 6);
      for (let tx = -16; tx <= 12; tx += 6) ctx.fillRect(tx, 13, 4, 6);
    }
  } else {
    ctx.scale(1.9, 1.9);
    const outline = '#080507';
    const fleshDark = isHurt ? '#ffccd5' : '#4a3f28';
    const fleshMid = isHurt ? '#ffffff' : '#8c7a4b';
    const fleshPale = isHurt ? '#ffffff' : '#c9b882';
    const boneCol = isHurt ? '#ffffff' : '#e5dec9';
    const veinCol = isHurt ? '#ff4d6d' : '#590d22';

    const breath = Math.sin(b.animPhase * 1.4) * 2.2;
    const headTilt = Math.sin(b.animPhase * 0.85) * 0.16;
    const isCasting = b.castingTimer > 0;
    const twitchX = isCasting ? (Math.random() - 0.5) * 2 : 0;
    const armLift = isCasting ? -34 + Math.sin(b.animPhase * 4.5) * 6 : Math.sin(b.animPhase * 1.1) * 7;
    const clawSpread = isCasting ? 5 : 1;

    ctx.fillStyle = 'rgba(12, 4, 14, 0.45)';
    drawPixelCircle(ctx, 0, -10, 56 + Math.sin(b.animPhase * 2) * 4, 2);
    if (isCasting) {
      ctx.fillStyle = 'rgba(255, 0, 85, 0.22)';
      drawPixelCircle(ctx, 0, -24, 64 + Math.sin(b.animPhase * 6) * 5, 2);
    }

    const legSway = Math.sin(b.animPhase * 1.1) * 3.5;
    ctx.fillStyle = outline;
    ctx.fillRect(-15 + legSway, 20, 10, 42);
    ctx.fillStyle = fleshDark;
    ctx.fillRect(-14 + legSway, 21, 8, 40);
    ctx.fillStyle = fleshMid;
    ctx.fillRect(-13 + legSway, 22, 5, 38);
    ctx.fillStyle = boneCol;
    ctx.fillRect(-13 + legSway, 36, 6, 4);

    ctx.fillStyle = outline;
    ctx.fillRect(5 - legSway, 20, 10, 42);
    ctx.fillStyle = fleshDark;
    ctx.fillRect(6 - legSway, 21, 8, 40);
    ctx.fillStyle = fleshMid;
    ctx.fillRect(7 - legSway, 22, 5, 38);
    ctx.fillStyle = boneCol;
    ctx.fillRect(7 - legSway, 36, 6, 4);

    const chestW = 34 + breath;
    ctx.fillStyle = outline;
    ctx.fillRect(-chestW / 2 - 2, -22, chestW + 4, 24);
    ctx.fillRect(-11, 2, 22, 20);
    ctx.fillStyle = fleshDark;
    ctx.fillRect(-chestW / 2, -20, chestW, 21);
    ctx.fillRect(-9, 1, 18, 19);
    ctx.fillStyle = fleshMid;
    ctx.fillRect(-chestW / 2 + 2, -19, chestW - 4, 18);
    ctx.fillRect(-7, 1, 14, 17);

    for (let rIdx = 0; rIdx < 4; rIdx++) {
      const ry = -16 + rIdx * 5 + breath * 0.25;
      const rw = 12 - rIdx;
      ctx.fillStyle = outline;
      ctx.fillRect(-rw - 3, ry, rw, 4);
      ctx.fillRect(3, ry, rw, 4);
      ctx.fillStyle = boneCol;
      ctx.fillRect(-rw - 2, ry + 1, rw - 1, 2);
      ctx.fillRect(3, ry + 1, rw - 1, 2);
    }

    ctx.fillStyle = '#240008';
    ctx.fillRect(-4, -10, 8, 8);
    ctx.fillStyle = isCasting ? '#ff0055' : '#9d0208';
    ctx.fillRect(-3, -9, 6, 6);

    ctx.fillStyle = outline;
    ctx.fillRect(-7, -31 + breath * 0.4, 14, 11);
    ctx.fillStyle = fleshDark;
    ctx.fillRect(-5, -30 + breath * 0.4, 10, 10);

    ctx.save();
    ctx.translate(twitchX, -45 + breath * 0.4);
    ctx.rotate(headTilt);

    ctx.fillStyle = outline;
    ctx.fillRect(-21, -16, 6, 8);
    ctx.fillRect(-24, -23, 5, 9);
    ctx.fillRect(15, -16, 6, 8);
    ctx.fillRect(19, -23, 5, 9);
    ctx.fillStyle = boneCol;
    ctx.fillRect(-21, -27, 2, 5);
    ctx.fillRect(19, -27, 2, 5);

    ctx.fillStyle = outline;
    ctx.fillRect(-17, -18, 34, 26);
    ctx.fillRect(-13, 8, 26, 11);
    ctx.fillStyle = fleshDark;
    ctx.fillRect(-15, -16, 30, 23);
    ctx.fillRect(-11, 7, 22, 10);
    ctx.fillStyle = fleshMid;
    ctx.fillRect(-13, -15, 26, 19);
    ctx.fillStyle = fleshPale;
    ctx.fillRect(-11, -14, 22, 5);
    ctx.fillStyle = veinCol;
    ctx.fillRect(-8, -13, 1, 4);
    ctx.fillRect(7, -14, 1, 5);

    ctx.fillStyle = '#050204';
    ctx.fillRect(-12, -8, 9, 9);
    ctx.fillRect(3, -9, 9, 10);

    const lookDir = Math.sign((player.x + 10) - cx);
    ctx.fillStyle = isCasting ? '#ff0055' : '#00f5d4';
    ctx.fillRect(-9 + lookDir, -5, 4, 4);
    ctx.fillRect(6 + lookDir, -6, 4, 4);

    const jawDrop = isCasting ? 5 : 2;
    ctx.fillStyle = '#050204';
    ctx.fillRect(-13, 4, 26, 9 + jawDrop);
    for (let tx = -11; tx <= 9; tx += 3) {
      const toothLen = (Math.abs(tx) % 2 === 0) ? 4 : 2;
      ctx.fillStyle = boneCol;
      ctx.fillRect(tx, 4, 2, toothLen);
      ctx.fillRect(tx + 1, 13 + jawDrop - toothLen, 2, toothLen);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(-18, -18);
    ctx.rotate((armLift * Math.PI) / 180);
    ctx.fillStyle = outline;
    ctx.fillRect(-6, 0, 9, 36);
    ctx.fillStyle = fleshDark;
    ctx.fillRect(-5, 1, 7, 34);
    ctx.translate(-2, 34);
    ctx.rotate((-armLift * 0.55 * Math.PI) / 180);
    ctx.fillStyle = outline;
    ctx.fillRect(-5, 0, 8, 34);
    ctx.fillStyle = fleshPale;
    ctx.fillRect(-3, 2, 3, 28);
    for (let f = -2; f <= 2; f++) {
      const fx = f * (2 + clawSpread * 0.35);
      ctx.fillStyle = isCasting ? '#ff4d6d' : boneCol;
      ctx.fillRect(fx, 31, 1, 9 - Math.abs(f));
    }
    ctx.restore();

    ctx.save();
    ctx.translate(18, -18);
    ctx.rotate((-armLift * Math.PI) / 180);
    ctx.fillStyle = outline;
    ctx.fillRect(-3, 0, 9, 36);
    ctx.fillStyle = fleshDark;
    ctx.fillRect(-2, 1, 7, 34);
    ctx.translate(2, 34);
    ctx.rotate((armLift * 0.55 * Math.PI) / 180);
    ctx.fillStyle = outline;
    ctx.fillRect(-3, 0, 8, 34);
    ctx.fillStyle = fleshPale;
    ctx.fillRect(0, 2, 3, 28);
    for (let f = -2; f <= 2; f++) {
      const fx = f * (2 + clawSpread * 0.35);
      ctx.fillStyle = isCasting ? '#ff4d6d' : boneCol;
      ctx.fillRect(fx, 31, 1, 9 - Math.abs(f));
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawBossMinions(minions) {
  for (let m of minions) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.fillStyle = '#140c07';
    drawPixelCircle(ctx, 0, 0, m.r + 2, 3);
    ctx.fillStyle = m.palette.shade;
    drawPixelCircle(ctx, 0, 0, m.r, 3);
    ctx.fillStyle = m.palette.main;
    drawPixelCircle(ctx, -1, -1, m.r - 2, 3);
    ctx.fillStyle = m.palette.highlight;
    drawPixelCircle(ctx, -6, -7, 5, 3);

    ctx.fillStyle = '#0b090a';
    ctx.fillRect(-7, -7, 4, 7);
    ctx.fillRect(3, -7, 4, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -6, 2, 2);
    ctx.fillRect(4, -6, 2, 2);

    ctx.fillStyle = '#0b090a';
    if (m.type === 'smile') {
      ctx.fillRect(-9, 3, 18, 3);
    } else {
      ctx.fillRect(-10, 2, 20, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-8, 3, 3, 4);
      ctx.fillRect(-2, 3, 3, 4);
      ctx.fillRect(4, 3, 3, 4);
    }
    ctx.restore();
  }
}

function drawBossLightnings(lightnings) {
  for (let lt of lightnings) {
    ctx.save();
    if (lt.warnTimer > 0) {
      ctx.strokeStyle = lt.warnTimer % 6 < 3 ? '#ff4d6d' : '#ffd166';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(lt.topX, 0);
      ctx.lineTo(lt.botX, 300);
      ctx.stroke();

      ctx.fillStyle = 'rgba(230, 57, 70, 0.45)';
      ctx.fillRect(lt.botX - 14, 292, 28, 8);
    } else {
      ctx.strokeStyle = '#00bbf9';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(lt.topX, 0);
      ctx.lineTo(lt.botX, 300);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lt.topX, 0);
      const steps = 6;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const bx = lt.topX + (lt.botX - lt.topX) * t + (Math.random() - 0.5) * 18;
        const by = 300 * t;
        ctx.lineTo(bx, by);
      }
      ctx.lineTo(lt.botX, 300);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawHeartsHUD() {
  if (!level || !level.isBoss) return;
  for (let i = 0; i < player.maxHp; i++) {
    const hx = 18 + i * 28;
    const hy = 16;
    const filled = i < player.hp;

    ctx.fillStyle = '#140c07';
    ctx.fillRect(hx + 2, hy, 6, 4);
    ctx.fillRect(hx + 12, hy, 6, 4);
    ctx.fillRect(hx, hy + 2, 20, 8);
    ctx.fillRect(hx + 2, hy + 10, 16, 4);
    ctx.fillRect(hx + 6, hy + 14, 8, 4);

    ctx.fillStyle = filled ? '#e63946' : '#343a40';
    ctx.fillRect(hx + 3, hy + 2, 5, 4);
    ctx.fillRect(hx + 12, hy + 2, 5, 4);
    ctx.fillRect(hx + 2, hy + 4, 16, 6);
    ctx.fillRect(hx + 4, hy + 10, 12, 3);
    ctx.fillRect(hx + 8, hy + 13, 4, 3);

    if (filled) {
      ctx.fillStyle = '#ff8fa3';
      ctx.fillRect(hx + 4, hy + 3, 3, 3);
    }
  }
}

function drawCrosshair() {
  if (!level || !level.isBoss || !mouse.active) return;
  const cx = Math.round(mouse.x);
  const cy = Math.round(mouse.y);
  const wep = getActiveWeapon();
  ctx.save();
  ctx.fillStyle = '#140c07';
  ctx.fillRect(cx - 8, cy - 2, 16, 4);
  ctx.fillRect(cx - 2, cy - 8, 4, 16);
  ctx.fillStyle = wep.bulletColor;
  ctx.fillRect(cx - 6, cy - 1, 5, 2);
  ctx.fillRect(cx + 2, cy - 1, 5, 2);
  ctx.fillRect(cx - 1, cy - 6, 2, 5);
  ctx.fillRect(cx - 1, cy + 2, 2, 5);
  ctx.restore();
}

function drawAttackCue(b) {
  const x = b.x+b.w/2, y = b.y+b.h/2;
  const volley = !b.meme && b.state === 'shoot' && b.timer > (b.phase === 1 ? 15 : 8);
  const charge = b.st === 'beat' && b.timer < 25;
  if (!volley && !charge && b.state !== 'slam_warn' && b.state !== 'arm_windup') return;
  ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = '#ffca70'; ctx.setLineDash([5,6]);
  ctx.beginPath();
  if (volley) {
    const angle = Math.atan2(player.y+14-y, player.x+10-x);
    for(const offset of [-0.24,0,0.24]) {ctx.moveTo(x,y);ctx.lineTo(x+180*Math.cos(angle+offset), y+180*Math.sin(angle+offset));}
  } else if (b.state === 'slam_warn') {
    ctx.moveTo(b.x, 298); ctx.lineTo(b.x+b.w,298);
    ctx.moveTo(x,y);ctx.lineTo(x,298);
  } else {
    const dir = charge ? b.face : b.armPunch.dir;
    ctx.moveTo(x,y); ctx.lineTo(x+200*dir,y);
  }
  ctx.stroke();ctx.restore();
}
function drawPlaying() {
  const biome = getBiomeForLevel(currentLevel);
  const bossType = (level.isBoss && level.boss) ? level.boss.bossType : 'default';
  renderBackgroundCache(biome, level.isBoss, bossType);

  ctx.save();
  if (shakeTimer > 0) {
    ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
  }

  const region=level.training?0:Math.floor(currentLevel/20)%5;
  const painted=paintPanorama(ctx,level.isBoss?5:region,800,450);
  if(!painted){ctx.drawImage(bgCache,0,0);drawSkyCameo(biome,level.isBoss);drawParallax();}

  if (level.isBoss && level.boss && level.boss.hp > 0 && level.boss.phase === 3) {
    drawBossEntity(level.boss);
  }

  if (level.singleProp) {
    drawReferenceProp(level.singleProp);
  }

  if(!painted)paintBattleHall();
  for (let p of level.platforms) drawPlatformBlock(p, biome);
  paintRoom();
  drawTrail();

  if (level.levelChest && !level.levelChest.opened) {
    drawLevelChest(level.levelChest);
  }

  drawNewHazards();
  if (level.isBoss && level.boss.hp > 0) drawAttackCue(level.boss);
  for (let sp of level.springs) {
    const compress = sp.bounceAnim > 0 ? 4 : 0;
    ctx.fillStyle = '#140c07';
    ctx.fillRect(sp.x + 6, sp.y + 5 + compress, 10, 7 - compress);
    ctx.fillStyle = '#e5e5e5';
    ctx.fillRect(sp.x + 7, sp.y + 6 + compress, 8, 6 - compress);
    ctx.fillStyle = '#140c07';
    ctx.fillRect(sp.x, sp.y + compress, sp.w, 7);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(sp.x + 1, sp.y + 1 + compress, sp.w - 2, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sp.x + 4, sp.y + 2 + compress, 3, 3);
    ctx.fillRect(sp.x + 14, sp.y + 2 + compress, 3, 3);
  }

  if (level.keyItem && !level.keyItem.collected) {
    const k = level.keyItem;
    const bob = Math.sin(Date.now() * 0.008) * 4;
    ctx.fillStyle = '#140c07';
    ctx.fillRect(k.x - 8, k.y - 8 + bob, 16, 16);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(k.x - 6, k.y - 6 + bob, 8, 8);
    ctx.fillRect(k.x + 2, k.y - 3 + bob, 6, 3);
    ctx.fillRect(k.x + 5, k.y + bob, 3, 4);
    ctx.fillStyle = '#140c07';
    ctx.fillRect(k.x - 3, k.y - 3 + bob, 2, 2);
  }

  for (let cn of level.cannons) {
    ctx.fillStyle = '#140c07';
    ctx.fillRect(cn.x, cn.y, cn.w, cn.h);
    ctx.fillStyle = '#495057';
    ctx.fillRect(cn.x + 2, cn.y + 2, cn.w - 4, cn.h - 4);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(cn.x, cn.y + 5, 4, 8);
  }
  for (let dt of level.darts) {
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(dt.x, dt.y, dt.w, dt.h);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(dt.x, dt.y, 4, dt.h);
  }

  for (let rk of level.fallingRocks) {
    if (rk.state === 'broken') continue;
    const sx = rk.state === 'shake' ? (Math.random() - 0.5) * 4 : 0;
    ctx.fillStyle = '#140c07';
    ctx.beginPath();
    ctx.moveTo(rk.x + sx, rk.y);
    ctx.lineTo(rk.x + rk.w + sx, rk.y);
    ctx.lineTo(rk.x + rk.w / 2 + sx, rk.y + rk.h);
    ctx.fill();

    ctx.fillStyle = '#adb5bd';
    ctx.beginPath();
    ctx.moveTo(rk.x + 2 + sx, rk.y + 2);
    ctx.lineTo(rk.x + rk.w - 2 + sx, rk.y + 2);
    ctx.lineTo(rk.x + rk.w / 2 + sx, rk.y + rk.h - 3);
    ctx.fill();
  }

  const d = level.door;
  ctx.fillStyle = '#140c07';
  ctx.fillRect(d.x - 5, d.y - 5, d.w + 10, d.h + 5);
  ctx.fillStyle = d.open ? '#ffd166' : '#4a2e1b';
  ctx.fillRect(d.x - 3, d.y - 3, d.w + 6, d.h + 3);
  ctx.fillStyle = '#140c07';
  ctx.fillRect(d.x - 1, d.y - 1, d.w + 2, d.h + 1);
  ctx.fillStyle = d.open ? '#0077b6' : '#24160e';
  ctx.fillRect(d.x + 1, d.y + 1, d.w - 2, d.h - 1);
  if (d.open) {
    const sw = Math.sin(Date.now() * 0.01) * 4;
    ctx.fillStyle = '#00bbf9';
    ctx.fillRect(d.x + 4, d.y + 4, d.w - 8, d.h - 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(d.x + 10 + sw, d.y + 8, 6, d.h - 14);
  } else if (level.keyItem && !level.keyItem.collected) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('🔒', d.x + d.w / 2, d.y + 26);
  }

  for (let s of level.spikes) {
    if (s.hidden && !s.triggered) continue;
    for (let sx = s.x; sx < s.x + s.w; sx += 16) {
      ctx.fillStyle = '#140c07';
      ctx.beginPath();
      ctx.moveTo(sx - 1, s.y + s.h);
      ctx.lineTo(sx + 8, s.y - 2);
      ctx.lineTo(sx + 17, s.y + s.h);
      ctx.fill();

      ctx.fillStyle = '#adb5bd';
      ctx.beginPath();
      ctx.moveTo(sx + 1, s.y + s.h);
      ctx.lineTo(sx + 8, s.y + 1);
      ctx.lineTo(sx + 15, s.y + s.h);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + 7, s.y + 3, 2, 6);
    }
  }

  for(const saw of level.saws)blade(saw.x,saw.y,saw.r);

  if (level.isBoss && level.boss) {
    const b = level.boss;
    if (b.hp > 0) {
      if (b.phase === 1 || b.phase === 2) drawBossEntity(b);
      drawBossMinions(b.minions);
      drawBossLightnings(b.lightnings);
      for (let pr of b.projectiles) {
        ctx.fillStyle = '#140c07';
        ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r + 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = pr.isPink ? '#ff007f' : '#ff5400';
        ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pr.x - 2, pr.y - 2, 3, 3);
      }

      ctx.fillStyle = '#140c07';
      ctx.fillRect(196, 14, 408, 22);
      ctx.fillStyle = '#212529';
      ctx.fillRect(200, 18, 400, 14);
      ctx.fillStyle = b.bossType === 'mogger' ? '#e9ecef' : (b.phase === 3 ? '#ff007f' : (b.phase === 2 ? '#ff9e00' : '#e63946'));
      ctx.fillRect(200, 18, Math.max(0, (b.hp / b.maxHp) * 400), 14);
      ctx.fillStyle = b.bossType === 'mogger' ? '#140c07' : '#ffffff';
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'center';
      const phaseTag = b.chapter === 0 ? ['NORMAL','SORRISO BIZARRO','MONSTRO'][b.phase-1] : b.singlePhase ? 'FASE ÚNICA' : `FASE ${b.phase}/3`;
      ctx.fillText(`${level.name} [${phaseTag}] - ${Math.ceil(b.hp)}/${b.maxHp}`, 400, 29);
    }
  }

  for (let pb of playerBullets) {
    ctx.save();
    ctx.translate(pb.x, pb.y);
    ctx.rotate(pb.angle || 0);
    drawShotEffect(ctx, pb.weaponId, pb.age);
    ctx.restore();
  }

  for (let ptb of petBullets) {
    ctx.fillStyle = '#140c07';
    ctx.fillRect(ptb.x - 4, ptb.y - 4, 8, 8);
    ctx.fillStyle = ptb.color;
    ctx.fillRect(ptb.x - 3, ptb.y - 3, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ptb.x - 1, ptb.y - 1, 2, 2);
  }

  if (deadTimer === 0) {
    const aimAngle = level.isBoss && level.boss?.hp > 0 ? getAimAngle(mouse.active) : null;
    if (player.invulnTimer === 0 || Math.floor(player.invulnTimer / 3) % 2 === 0) {
      drawSkinCharacter(ctx, player.x, player.y, player.w, player.h, getActiveSkin(), player.facing, player.walkAnim, player.squashX, player.squashY, aimAngle);
    }
    const activePet = getActivePet();
    if (activePet) {
      drawPetSprite(ctx, companion.x - companion.recoil, companion.y, activePet, 1.0);
    }
    if (player.parryTimer > 0) {
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x + player.w / 2, player.y + player.h / 2, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  for (let sw of shockwaves) {
    ctx.strokeStyle = sw.color;
    ctx.globalAlpha = Math.max(0, sw.alpha);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (let p of particles) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  for (let ft of floatingTexts) {
    ctx.fillStyle = '#140c07';
    ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
  }

  drawHeartsHUD();
  drawCrosshair();

  if (bossBannerTimer > 0) {
    ctx.fillStyle = 'rgba(20, 12, 7, 0.85)';
    ctx.fillRect(0, 175, 800, 75);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ CHEFE: ${level.name} ⚠`, 400, 210);
    ctx.fillStyle = '#ff8fa3';
    ctx.font = 'bold 13px Courier New';
    const boss=level.boss;
    const bannerSub=boss.chapter===0?'Verity tem três formas. Observe o sorriso.':boss.maxHp+' HP • '+(boss.bossType==='mogger'?'Desvie do soco gigante.':'Observe o aviso antes de cada ataque.');
    ctx.fillText(bannerSub, 400, 234);
  }

  if (knockoutTimer > 0) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 40px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(level.expedition.done?'NOCAUTE! ENTRE NO PORTAL!':'NOCAUTE! COMPLETE O OBJETIVO!', 400, 150);
  }

  if (deadTimer > 0 && diedToBoss) {
    ctx.fillStyle = 'rgba(10, 10, 14, 0.78)';
    ctx.fillRect(0, 0, 800, 450);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 165, 800, 115);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.font = '900 54px Courier New';
    ctx.fillText('VOCÊ SE FERROU', 404, 232);
    ctx.fillStyle = '#d90429';
    ctx.fillText('VOCÊ SE FERROU', 400, 228);

    ctx.fillStyle = '#adb5bd';
    ctx.font = 'bold 13px Courier New';
    ctx.fillText('O CHEFE ACABOU COM OS SEUS 3 CORAÇÕES...', 400, 260);
  }

  ctx.restore();
}

// =========================================================================
// TELAS DE INTERFACE 16-BIT
// =========================================================================
function drawBox(x, y, w, h, bg = C_SOLAR_PANEL, border = C_SOLAR_ACCENT) {
  ctx.fillStyle = '#140c07'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = border; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - 2, y + h, w + 4, 2); ctx.fillRect(x + w, y - 2, 2, h + 4);
  ctx.fillStyle = '#140c07'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.fillRect(x + 2, y + 2, w - 4, Math.max(1, ((h - 4) / 3) | 0));
  ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y, 2, h);
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x, y + h - 2, w, 2); ctx.fillRect(x + w - 2, y, 2, h);
  if (w > 60 && h > 40) { ctx.fillStyle = border; [[x + 4, y + 4], [x + w - 7, y + 4], [x + 4, y + h - 7], [x + w - 7, y + h - 7]].forEach(q => ctx.fillRect(q[0], q[1], 3, 3)); }
}

function drawButton(x, y, w, h, label, font, bg, border, fg) {
  const hv = mouse.active && mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h;
  drawBox(x, y, w, h, bg, hv ? '#ffffff' : border);
  if (hv) { ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x, y, w, h); }
  ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.fillText(label, x + w / 2, y + h / 2 + 6);
}

function drawStagePortal(bx, by, w, h, lvlIdx, isUnlocked, isCompleted, isBoss) {
  const cx = bx + w / 2, cy = by + h / 2 - 4, T = Date.now() * 0.004 + lvlIdx;
  const hv = isUnlocked && mouse.active && mouse.x >= bx && mouse.x <= bx + w && mouse.y >= by && mouse.y <= by + h;
  const col = !isUnlocked ? ['#343a40', '#212529', '#101418'] : isBoss ? ['#ffd166', '#d00000', '#ff0055'] : isCompleted ? ['#70e000', '#2b9348', '#38b000'] : ['#4cc9f0', '#0077b6', '#00bbf9'];
  ctx.fillStyle = '#140c07'; ctx.fillRect(cx - 28, by + h - 16, 56, 10); ctx.fillStyle = '#6c757d'; ctx.fillRect(cx - 26, by + h - 15, 52, 6); ctx.fillStyle = '#adb5bd'; ctx.fillRect(cx - 26, by + h - 15, 52, 1);
  ctx.fillStyle = '#140c07'; ctx.fillRect(cx - 23, cy - 27, 46, 46);
  ctx.fillStyle = isUnlocked ? '#868e96' : '#495057'; ctx.fillRect(cx - 21, cy - 25, 42, 42);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 5; k++) { ctx.fillRect(cx - 21, cy - 25 + k * 9, 42, 1); ctx.fillRect(cx - 21 + ((k * 13) % 30) + 4, cy - 25 + k * 9, 1, 9); }
  ctx.fillStyle = col[0]; ctx.fillRect(cx - 17, cy - 21, 34, 34); ctx.fillStyle = col[1]; ctx.fillRect(cx - 15, cy - 19, 30, 30);
  if (isUnlocked) {
    for (let r = 0; r < 4; r++) { const sz = 24 - r * 6, ox = Math.round(Math.cos(T + r) * (2 + r)), oy = Math.round(Math.sin(T + r) * (2 + r)); ctx.fillStyle = r % 2 ? col[0] : col[2]; ctx.fillRect(cx - sz / 2 + ox, cy - 4 - sz / 2 + oy, sz, sz); }
    ctx.fillStyle = '#fff'; for (let k = 0; k < 4; k++) ctx.fillRect(Math.round(cx + Math.cos(T * 1.5 + k * 1.57) * 17), Math.round(cy - 4 + Math.sin(T * 1.5 + k * 1.57) * 17), 2, 2);
    glow(cx, cy - 4, hv ? 38 : 28, isBoss ? '255,0,85' : '76,201,240');
    if (isBoss) { ctx.fillStyle = '#ffd166'; [[-21, -33], [-9, -37], [3, -37], [15, -33]].forEach(q => ctx.fillRect(cx + q[0], cy + q[1], 6, 9)); }
    if (isCompleted && !isBoss) { ctx.fillStyle = '#fff'; ctx.fillRect(cx - 6, cy - 2, 3, 3); ctx.fillRect(cx - 3, cy + 1, 3, 3); ctx.fillRect(cx, cy - 2, 3, 3); ctx.fillRect(cx + 3, cy - 5, 3, 3); }
  } else {
    ctx.fillStyle = '#101418'; ctx.fillRect(cx - 13, cy - 17, 26, 26);
    ctx.fillStyle = '#868e96'; ctx.fillRect(cx - 6, cy - 12, 12, 8); ctx.fillStyle = '#101418'; ctx.fillRect(cx - 4, cy - 10, 8, 6);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(cx - 8, cy - 5, 16, 11); ctx.fillStyle = '#140c07'; ctx.fillRect(cx - 1, cy - 2, 2, 5);
  }
  if (hv) { ctx.fillStyle = '#fff'; ctx.fillRect(cx - 23, cy - 29, 46, 2); }
  ctx.fillStyle = '#140c07'; ctx.fillRect(cx - 24, by + h - 9, 48, 16);
  ctx.fillStyle = !isUnlocked ? '#6c757d' : (isBoss ? '#ff4d6d' : (isCompleted ? '#80ed99' : '#ffd166'));
  ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center';
  ctx.fillText(isBoss ? `💀${lvlIdx + 1}` : `#${lvlIdx + 1}`, cx, by + h + 3);
}

function drawTitleScreen() {
  renderBackgroundCache(BIOMES[0], false);
  ctx.drawImage(bgCache, 0, 0);
  drawSkyCameo(BIOMES[0], false);
  drawParallax(); drawAmbient();

  drawBox(120, 48, 560, 354, 'rgba(30, 18, 11, 0.95)', '#ffd166');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#70e000';
  ctx.font = 'bold 13px Courier New';
  ctx.fillText('★ EDIÇÃO 16-BIT • BAÚS SECRETOS • MIRA 360° & PETS ★', 400, 82);

  ctx.font = 'bold 36px Courier New'; ctx.fillStyle = '#140c07';
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [3, 3]]) ctx.fillText('SOLARIS ADVENTURE', 400 + dx, 122 + dy);
  ctx.fillStyle = '#ffd166'; ctx.fillText('SOLARIS ADVENTURE', 400, 122);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(238, 100, 324, 3);

  drawBox(180, 142, 440, 130, '#24160e', '#55a630');
  const sk = getActiveSkin();
  const wep = getActiveWeapon();
  const pet = getActivePet();

  drawSkinCharacter(ctx, 370, 206, 20, 28, sk, 1, Date.now() * 0.006, 1.35, 1.35, null);
  if (pet) {
    drawPetSprite(ctx, 332, 186 + Math.sin(Date.now() * 0.006) * 4, pet, 1.35);
  }
  drawWeaponIcon(ctx, 415, 175, 50, 36, wep);

  ctx.fillStyle = sk.rarityColor;
  ctx.font = 'bold 12px Courier New';
  ctx.fillText(`HERÓI: ${sk.name}`, 400, 232);
  ctx.fillStyle = '#d8f3dc';
  ctx.font = 'bold 11px Courier New';
  ctx.fillText(`ARMA: ${wep.name}  •  PET: ${pet ? pet.name : 'Nenhum (Compre Ovos na Loja!)'}`, 400, 252);

  drawButton(265, 294, 270, 46, '🌀 ENTRAR NOS PORTAIS', 'bold 19px Courier New', '#2b9348', '#70e000', '#ffffff');

  drawButton(265, 350, 270, 34, '🏪 ABRIR LOJA DE OVOS & CAIXAS', 'bold 13px Courier New', '#4a2e1b', '#ffd166', '#ffd166');
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.fillText('v1.0 • SOLARIS STUDIO © 2026', 400, 396);
}

function drawMapScreen() {
  const startLvl = mapPage * 20;
  const biome = getBiomeForLevel(startLvl);
  renderBackgroundCache(biome, false);
  if(!paintPanorama(ctx,mapPage%5,800,450))ctx.drawImage(bgCache,0,0);

  drawBox(35, 18, 730, 414, 'rgba(30, 18, 11, 0.94)', '#ffd166');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 16px Courier New';
  ctx.fillText(`PORTAIS DO MUNDO ${mapPage + 1} · ${riverChapters[mapPage%riverChapters.length][0]}`, 400, 46);

  drawBox(55, 26, 70, 28, '#4a2e1b', '#ffd166');
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 12px Courier New';
  ctx.fillText('◀ ANT', 90, 44);

  drawBox(675, 26, 70, 28, '#4a2e1b', '#ffd166');
  ctx.fillText('PRÓX ▶', 710, 44);

  for (let i = 0; i < 20; i++) {
    const lvlIdx = startLvl + i;
    const col = i % 5;
    const row = Math.floor(i / 5);
    const bx = 72 + col * 116;
    const by = 72 + row * 84;
    const isBoss = (lvlIdx + 1) % 20 === 0;
    const isUnlocked = lvlIdx <= unlockedLevel;
    const isCompleted = lvlIdx < unlockedLevel;
    drawStagePortal(bx, by, 98, 66, lvlIdx, isUnlocked, isCompleted, isBoss);
    if (stageStars[lvlIdx]) {
      ctx.fillStyle='#271c13'; ctx.fillRect(bx+64,by+3,36,16);
      ctx.fillStyle='#ffda64'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('★'.repeat(stageStars[lvlIdx]),bx+82,by+16);
    }
  }

  const chestUnlocked = (unlockedLevel >= startLvl + 20 || (startLvl+20===TOTAL_LEVELS && stageStars[TOTAL_LEVELS-1]));
  const chestOpened = openedChests.includes(mapPage);
  drawBox(660, 145, 88, 150, chestOpened ? '#24160e' : (chestUnlocked ? '#6a040f' : '#1d140e'), '#ffd166');
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 11px Courier New';
  ctx.fillText('BAÚ DO', 704, 172);
  ctx.fillText('CAPÍTULO', 704, 186);
  drawDetailedChestSprite(ctx, 704, 224, 1.3, chestOpened ? 1.0 : 0);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 10px Courier New';
  ctx.fillText('SORTE 2×', 704, 257);
  ctx.fillText(chestOpened ? 'ABERTO' : (chestUnlocked ? 'ABRIR!' : 'VENÇA O BOSS'), 704, 275);
}

function drawShopScreen() {
  renderBackgroundCache(BIOMES[2], false);
  ctx.drawImage(bgCache, 0, 0);
  drawBox(35, 22, 730, 406, 'rgba(30, 18, 11, 0.96)', '#ffd166');

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 20px Courier New';
  ctx.fillText(`LOJA SOLARIS • SEU SALDO: ${sunflowers} 🌻`, 400, 52);

  ctx.fillStyle='#ffffff';ctx.font='bold 12px Courier New';
  drawBox(205,68,180,32,shopTab==='weapons'?'#2b9348':'#4a2e1b','#ffd166');
  ctx.fillStyle='#ffffff';ctx.fillText('CAIXAS DE ARMAS',295,88);
  drawBox(415,68,180,32,shopTab==='pets'?'#2b9348':'#4a2e1b','#ffd166');
  ctx.fillStyle='#ffffff';ctx.fillText('OVOS DE PETS',505,88);
  const list=shopTab==='weapons'?WEAPON_CRATES:PET_EGGS;
  list.forEach((item, idx) => {
    const bx = 62 + idx * 172;
    const by = 122;
    drawBox(bx, by, 158, 265, '#3b2416', item.borderColor);
    ctx.fillStyle = item.borderColor;
    ctx.font = 'bold 12px Courier New';
    ctx.fillText(item.name, bx + 79, by + 28);

    if (shopTab === 'pets') {
      drawEggIcon(ctx, bx + 79, by + 78, item.shellColor, item.spotColor);
    } else {
      drawDetailedChestSprite(ctx, bx + 79, by + 80, 1.5, 0);
    }

    ctx.fillStyle = '#e5e5e5';
    ctx.font = 'bold 10px Courier New';
    const parts = item.desc.split('•');
    parts.forEach((pt, pi) => ctx.fillText(pt.trim(), bx + 79, by + 132 + pi * 16));

    const canAfford = sunflowers >= item.price;
    drawBox(bx + 16, by + 206, 126, 38, canAfford ? '#2b9348' : '#495057', '#ffd166');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Courier New';
    ctx.fillText(shopTab === 'pets' ? `CHOCAR ${item.price}🌻` : `ABRIR ${item.price}🌻`, bx + 79, by + 230);
  });
}

function drawWeaponsScreen() {
  renderBackgroundCache(BIOMES[1], false);
  ctx.drawImage(bgCache, 0, 0);
  drawBox(35, 20, 730, 410, 'rgba(30, 18, 11, 0.96)', '#ffd166');

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 18px Courier New';
  ctx.fillText(`ARSENAL DE ARMAS SOLARIS (${ownedWeapons.length}/${WEAPONS.length})`, 400, 50);

  const startIdx = wepPage * 8;
  for (let i = 0; i < 8; i++) {
    const wId = startIdx + i;
    if (wId >= WEAPONS.length) break;
    const wep = WEAPONS[wId];
    const owned = ownedWeapons.includes(wId);
    const equipped = equippedWeaponId === wId;
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = 65 + col * 342;
    const by = 74 + row * 74;

    drawBox(bx, by, 326, 62, equipped ? '#2b9348' : (owned ? '#3b2416' : '#1d140e'), owned ? wep.rarityColor : '#495057');
    drawWeaponIcon(ctx, bx + 14, by + 11, 50, 40, wep);

    ctx.textAlign = 'left';
    ctx.fillStyle = owned ? wep.rarityColor : '#6c757d';
    ctx.font = 'bold 11px Courier New';
    ctx.fillText(`${wep.name} [${wep.rarity}]`, bx + 74, by + 23, 165);

    ctx.fillStyle = '#e5e5e5';
    ctx.font = 'bold 10px Courier New';
    ctx.fillText(`Dano/proj.: ${wep.damage.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} | ${wep.shotsPerSecond.toFixed(2).replace('.', ',')} tiros/s`, bx + 74, by + 44);

    ctx.textAlign = 'right';
    ctx.fillStyle = equipped ? '#ffd166' : (owned ? '#70e000' : '#6c757d');
    ctx.fillText(equipped ? '✔ EM USO' : (owned ? 'EQUIPAR' : 'BLOQUEADA'), bx + 314, by + 23);
  }

  ctx.textAlign = 'center';
  drawBox(260, 384, 80, 28, '#4a2e1b', '#ffd166');
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 12px Courier New';
  ctx.fillText('◀ ANT', 300, 402);
  ctx.fillText(`PÁG ${wepPage + 1}/${Math.ceil(WEAPONS.length / 8)}`, 400, 402);
  drawBox(460, 384, 80, 28, '#4a2e1b', '#ffd166');
  ctx.fillText('PRÓX ▶', 500, 402);
}

function petCardY(i) { return 64 + Math.floor(i / 2) * 53; }
function drawPetsScreen() {
  renderBackgroundCache(BIOMES[3], false);
  ctx.drawImage(bgCache, 0, 0);
  drawBox(35, 20, 730, 410, 'rgba(30, 18, 11, 0.96)', '#ffd166');

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 18px Courier New';
  ctx.fillText(`COMPANHEIROS PETS (${ownedPets.length}/${PETS.length}) • ATIRAM EM BOSSES`, 400, 50);

  for (let i = 0; i < PETS.length; i++) {
    const pet = PETS[i];
    const owned = ownedPets.includes(pet.id);
    const equipped = equippedPetId === pet.id;
    const col = i % 2;
    
    const bx = 65 + col * 342;
    const by = petCardY(i);

    drawBox(bx, by, 326, 49, equipped ? '#2b9348' : (owned ? '#3b2416' : '#1d140e'), owned ? pet.rarityColor : '#495057');
    drawPetSprite(ctx, bx + 36, by + 25, pet, 1.4);

    ctx.textAlign = 'left';
    ctx.fillStyle = owned ? pet.rarityColor : '#6c757d';
    ctx.font = 'bold 11px Courier New';
    ctx.fillText(`${pet.name} [${pet.rarity}]`, bx + 72, by + 18);

    ctx.fillStyle = '#e5e5e5';
    ctx.font = 'bold 10px Courier New';
    ctx.fillText(`Apoio: ${pet.damage} dano | ${pet.desc}`, bx + 72, by + 37);

    ctx.textAlign = 'right';
    ctx.fillStyle = equipped ? '#ffd166' : (owned ? '#70e000' : '#6c757d');
    ctx.fillText(equipped ? '✔ EQUIPADO' : (owned ? 'EQUIPAR' : 'CHOCAR OVO'), bx + 314, by + 18);
  }

  ctx.textAlign = 'center';
  drawBox(280, 384, 240, 28, '#4a2e1b', '#ffd166');
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 12px Courier New';
  ctx.fillText('COMPRE OVOS NA ABA 🏪 LOJA', 400, 402);
}

// =========================================================================
// TOKEN SOLAR ("S") & ANIMAÇÃO DE ABERTURA DO BAÚ
// =========================================================================
function drawSolarTokenIcon(c, cx, cy, scale = 1) {
  c.save();
  c.translate(Math.round(cx), Math.round(cy));
  c.scale(scale, scale);

  c.fillStyle = 'rgba(255, 209, 102, 0.28)';
  drawPixelCircle(c, 0, 0, 26, 2);

  c.fillStyle = '#140c07';
  c.fillRect(-16, -16, 32, 32);
  c.fillStyle = '#e09f3e';
  for (let i = -13; i <= 13; i += 2) {
    c.fillRect(i - 1, i - 1, 3, 3);
    c.fillRect(i - 1, -i - 1, 3, 3);
  }

  c.fillStyle = '#140c07';
  drawPixelCircle(c, 0, 0, 19, 2);
  c.fillStyle = '#d48c00';
  drawPixelCircle(c, 0, 0, 17, 2);
  c.fillStyle = '#ffd166';
  drawPixelCircle(c, -1, -1, 15, 2);
  c.fillStyle = '#24160e';
  drawPixelCircle(c, 0, 0, 12, 2);

  c.fillStyle = '#140c07';
  c.fillRect(-3, -24, 6, 48);
  c.fillRect(-24, -3, 48, 6);
  c.fillStyle = '#ffd166';
  c.fillRect(-2, -22, 4, 44);
  c.fillRect(-22, -2, 44, 4);
  c.fillStyle = '#ffffff';
  c.fillRect(-1, -21, 2, 10);
  c.fillRect(-21, -1, 10, 2);

  c.fillStyle = '#140c07';
  drawPixelCircle(c, 0, 0, 12, 2);
  c.fillStyle = '#ff9e00';
  drawPixelCircle(c, 0, 0, 10, 2);
  c.fillStyle = '#ffca3a';
  drawPixelCircle(c, -1, -1, 8, 2);
  c.fillStyle = '#ffffff';
  c.fillRect(-6, -6, 3, 3);

  c.fillStyle = '#140c07';
  c.fillRect(-4, -6, 9, 13);
  c.fillStyle = '#ffffff';
  c.fillRect(-3, -5, 7, 2);
  c.fillRect(-3, -3, 2, 2);
  c.fillRect(-3, -1, 7, 2);
  c.fillRect(2, 1, 2, 2);
  c.fillRect(-3, 3, 7, 2);

  c.restore();
}

function drawOverlays() {
  if (chestAnim.active) {
    ctx.fillStyle = 'rgba(0,0,0,0.86)';
    ctx.fillRect(0, 0, 800, 450);

    const elapsed = chestAnim.maxTimer - chestAnim.timer;
    const openProgress = Math.min(1, elapsed / 38);
    const shakeX = elapsed < 22 ? Math.sin(elapsed * 2.2) * 4 : 0;

    drawBox(140, 80, 520, 290, '#24160e', chestAnim.color);

    if (openProgress > 0.35) {
      const beamAlpha = Math.min(0.45, (openProgress - 0.35) * 0.7);
      ctx.save();
      ctx.fillStyle = `rgba(255, 209, 102, ${beamAlpha})`;
      ctx.beginPath();
      ctx.moveTo(375, 240);
      ctx.lineTo(265, 115);
      ctx.lineTo(535, 115);
      ctx.lineTo(425, 240);
      ctx.fill();
      ctx.restore();
    }

    drawDetailedChestSprite(ctx, 400 + shakeX, 248, 2.3, openProgress);

    if (openProgress >= 0.45) {
      const rise = Math.min(1, (openProgress - 0.45) / 0.55);
      const itemY = 230 - Math.round(rise * 56);

      if(chestAnim.rewardType==='pet'){
        drawPetSprite(ctx,400,itemY,PETS[chestAnim.id],1.5);
      }else if(chestAnim.rewardType==='weapon'){
        drawWeaponIcon(ctx,377,itemY-24,46,30,WEAPONS[chestAnim.id]);
      } else {
        ctx.fillStyle = '#140c07';
        ctx.fillRect(386, itemY - 26, 28, 28);
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(388, itemY - 24, 24, 24);
        ctx.fillStyle = '#ff9e00';
        ctx.fillRect(392, itemY - 20, 16, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(394, itemY - 22, 6, 4);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = chestAnim.color;
      ctx.font = 'bold 21px Courier New';
      ctx.fillText(chestAnim.title, 400, 122);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Courier New';
      ctx.fillText(chestAnim.subtitle, 400, 146);
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 20px Courier New';
      ctx.fillText('ABRINDO BAÚ DO TESOURO...', 400, 128);
    }

    if (elapsed > 55) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#70e000';
      ctx.font = 'bold 12px Courier New';
      ctx.fillText('[ESPAÇO OU CLIQUE PARA CONTINUAR]', 400, 350);
    }
  }

  if (crateAnim.active) {
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, 800, 450);
    drawBox(120, 105, 560, 240, '#24160e', crateAnim.crateColor);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText(crateAnim.mode === 'pet' ? `CHOCANDO ${crateAnim.crateName}...` : `ABRINDO ${crateAnim.crateName}...`, 400, 146);

    const progress = Math.min(1, (1 - crateAnim.timer / crateAnim.maxTimer) * 1.25);
    const eased = 1 - Math.pow(1 - progress, 3);
    const idx = Math.min(30, Math.floor(eased * 30));
    const currentId = crateAnim.rouletteIds[idx];

if (crateAnim.mode === 'weapon') {
      const wep = getWeaponById(currentId);
      drawBox(310, 166, 180, 110, '#3b2416', wep.rarityColor);
      drawWeaponIcon(ctx, 375, 194, 50, 40, wep);
      ctx.fillStyle = wep.rarityColor;
      ctx.font = 'bold 13px Courier New';
      ctx.fillText(`${wep.name} (${wep.rarity})`, 400, 262);
    } else if (crateAnim.mode === 'pet') {
      const pet = getPetById(currentId) || PETS[0];
      drawBox(300, 166, 200, 112, '#3b2416', pet.rarityColor);
      if (crateAnim.timer > crateAnim.maxTimer - 45) {
        const shakeX = Math.sin(Date.now() * 0.06) * 4;
        drawEggIcon(ctx, 400 + shakeX, 214, crateAnim.eggShell, crateAnim.eggSpot);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Courier New';
        ctx.fillText('RACHANDO OVO...', 400, 262);
      } else {
        drawPetSprite(ctx, 400, 214, pet, 2.0);
        ctx.fillStyle = pet.rarityColor;
        ctx.font = 'bold 12px Courier New';
        ctx.fillText(`${pet.name} (${pet.rarity})`, 400, 262);
      }
    }

    if (crateAnim.timer < crateAnim.maxTimer - 40) {
      ctx.fillStyle = '#70e000';
      ctx.font = 'bold 12px Courier New';
      ctx.fillText('✔ EQUIPADO AUTOMATICAMENTE! [CLIQUE PARA FECHAR]', 400, 320);
    }
  }
}

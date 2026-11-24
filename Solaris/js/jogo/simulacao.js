function updateMoggerBoss(b) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const dirToPlayer = (player.x + 10) >= cx ? 1 : -1;

  if (b.chinStrokeTimer > 0) b.chinStrokeTimer--;

  if (b.state === 'float') {
    b.x += b.vx;
    b.y = 140 + Math.sin(Date.now() * 0.003) * 4;
    if (b.x <= 70 || b.x + b.w >= 730) b.vx *= -1;
    b.timer--;

    if (b.timer <= 0) {
      if (Math.random() < 0.52) {
        // Ataque 1: Soco Gigante com o Braço Musculoso
        b.state = 'arm_windup';
        b.timer = 30;
        b.armPunch = {
          active: true,
          progress: 0,
          dir: dirToPlayer,
          y: Math.max(175, Math.min(272, player.y + 10)),
          hitDone: false
        };
      } else {
        // Ataque 2: Passar a mão no queixo ("Moggar") -> Tempestade de Raios!
        b.state = 'mog_chin';
        b.timer = 46;
        b.chinStrokeTimer = 46;
        sfxMogBling();
        spawnFloatingText(cx, b.y - 16, '✨ MOGGING! ✨', '#ffffff');
      }
    }
  } else if (b.state === 'arm_windup') {
    b.timer--;
    if (b.timer <= 0) {
      b.state = 'arm_punch';
      b.timer = 26;
      shakeTimer = 10;
      playTone(140, 'sawtooth', 0.16, 0.08, 55);
    }
  } else if (b.state === 'arm_punch') {
    b.timer--;
    // Estende e recolhe o braço gigante
    if (b.timer > 12) {
      b.armPunch.progress = Math.min(1, b.armPunch.progress + 0.14);
    } else {
      b.armPunch.progress = Math.max(0, b.armPunch.progress - 0.09);
    }

    const reach = b.armPunch.progress * 260;
    const armStartX = cx + b.armPunch.dir * 24;
    const armX = b.armPunch.dir > 0 ? armStartX : armStartX - reach;
    const armW = reach;
    const armY = b.armPunch.y - 18;
    const armH = 36;

    if (!b.armPunch.hitDone && reach > 35) {
      if (rectIntersect(player.x, player.y, player.w, player.h, armX, armY, armW, armH)) {
        b.armPunch.hitDone = true;
        damagePlayer();
      }
    }

    if (b.timer <= 0) {
      b.armPunch.active = false;
      b.state = 'float';
      b.timer = 52;
    }
  } else if (b.state === 'mog_chin') {
    b.timer--;
    if (b.timer === 24) {
      // Invoca vários raios na arena inteira!
      for (let k = 0; k < 5; k++) {
        const rx = 65 + k * 165 + (Math.random() - 0.5) * 65;
        b.lightnings.push({
          topX: Math.max(40, Math.min(760, rx + (Math.random() - 0.5) * 140)),
          botX: Math.max(40, Math.min(760, rx)),
          warnTimer: 40 + k * 4,
          activeTimer: 16,
          hitDone: false
        });
      }
      // Também mira 1 raio direto perto do jogador
      spawnDiagonalLightning(b);
    }
    if (b.timer <= 0) {
      b.state = 'float';
      b.timer = 65;
    }
  }

  for (let i = b.lightnings.length - 1; i >= 0; i--) {
    const lt = b.lightnings[i];
    if (lt.warnTimer > 0) {
      lt.warnTimer--;
      if (lt.warnTimer === 0) {
        sfxLightning();
        shakeTimer = 10;
      }
    } else {
      lt.activeTimer--;
      if (!lt.hitDone) {
        const dist = pointToSegmentDist(player.x + 10, player.y + 14, lt.topX, 0, lt.botX, 300);
        if (dist < 18) {
          lt.hitDone = true;
          damagePlayer();
        }
      }
      if (lt.activeTimer <= 0) b.lightnings.splice(i, 1);
    }
  }

  if (rectIntersect(player.x, player.y, player.w, player.h, b.x + 12, b.y + 10, b.w - 24, b.h - 14)) {
    damagePlayer();
  }
}


function updateBossFight(b) {
  if (b.hurtTimer > 0) b.hurtTimer--;
  b.animPhase += 0.08;
  if (b.castingTimer > 0) b.castingTimer--;

  if(b.training){updateTraining(b);return;}
  if (b.meme) { updateMemeBoss(b); return; }
  if (b.bossType === 'mogger') {
    updateMoggerBoss(b);
    return;
  }

  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;

  if (b.phase === 1) {
    if (b.state === 'float') {
      b.x += b.vx;
      b.y = 115 + Math.sin(Date.now() * 0.004) * 20;
      if (b.x <= 60 || b.x + b.w >= 740) b.vx *= -1;
      b.timer--;
      if (b.timer <= 0) {
        const r = Math.random();
        if (r < 0.45) {
          b.state = 'shoot';
          b.timer = 30;
        } else if (r < 0.78) {
          b.state = 'slam_warn';
          b.x = Math.max(60, Math.min(670, player.x - 24));
          b.timer = 32;
        } else {
          spawnColoredMinions(b, 2);
          b.timer = 65;
        }
      }
    } else if (b.state === 'shoot') {
      b.timer--;
      if (b.timer === 15) {
        const baseAng = Math.atan2((player.y + 14) - cy, (player.x + 10) - cx);
        [-0.22, 0, 0.22].forEach((offset, idx) => {
          b.projectiles.push({
            x: cx, y: cy,
            vx: Math.cos(baseAng + offset) * 3.6,
            vy: Math.sin(baseAng + offset) * 3.6,
            r: 8, isPink: idx === 1
          });
        });
      }
      if (b.timer <= 0) { b.state = 'float'; b.timer = 55; }
    } else if (b.state === 'slam_warn') {
      b.timer--;
      if (b.timer <= 0) { b.state = 'slam_drop'; b.vy = 11; }
    } else if (b.state === 'slam_drop') {
      b.y += b.vy;
      if (b.y + b.h >= 300) {
        b.y = 300 - b.h;
        shakeTimer = 12;
        addShockwave(cx, 300, '#ffd166');
        b.state = 'slam_recover';
        b.timer = 26;
      }
    } else if (b.state === 'slam_recover') {
      b.timer--;
      if (b.timer <= 0) { b.y = 115; b.state = 'float'; b.timer = 50; }
    }
  } else if (b.phase === 2) {
    if (b.state === 'float') {
      b.x += b.vx * 1.45;
      b.y = 105 + Math.sin(Date.now() * 0.006) * 24;
      if (b.x <= 55 || b.x + b.w >= 745) b.vx *= -1;
      b.timer--;
      if (b.timer <= 0) {
        const r = Math.random();
        if (r < 0.35) {
          b.state = 'shoot';
          b.timer = 26;
        } else if (r < 0.65) {
          spawnDiagonalLightning(b);
          if (Math.random() < 0.5) spawnDiagonalLightning(b);
          b.timer = 52;
        } else if (r < 0.85) {
          spawnColoredMinions(b, 2);
          b.timer = 55;
        } else {
          b.state = 'slam_warn';
          b.x = Math.max(60, Math.min(670, player.x - 24));
          b.timer = 26;
        }
      }
    } else if (b.state === 'shoot') {
      b.timer--;
      if (b.timer === 18 || b.timer === 8) {
        const baseAng = Math.atan2((player.y + 14) - cy, (player.x + 10) - cx);
        [-0.25, 0, 0.25].forEach((offset, idx) => {
          b.projectiles.push({
            x: cx, y: cy,
            vx: Math.cos(baseAng + offset) * 4.2,
            vy: Math.sin(baseAng + offset) * 4.2,
            r: 8, isPink: idx === 1
          });
        });
      }
      if (b.timer <= 0) { b.state = 'float'; b.timer = 45; }
    } else if (b.state === 'slam_warn') {
      b.timer--;
      if (b.timer <= 0) { b.state = 'slam_drop'; b.vy = 13; }
    } else if (b.state === 'slam_drop') {
      b.y += b.vy;
      if (b.y + b.h >= 300) {
        b.y = 300 - b.h;
        shakeTimer = 14;
        addShockwave(cx, 300, '#ff5400');
        b.state = 'slam_recover';
        b.timer = 22;
      }
    } else if (b.state === 'slam_recover') {
      b.timer--;
      if (b.timer <= 0) { b.y = 105; b.state = 'float'; b.timer = 40; }
    }
  } else if (b.phase === 3) {
    b.x = 364 + Math.sin(Date.now() * 0.0018) * 95;
    b.y = 144 + Math.cos(Date.now() * 0.0025) * 14;
    b.timer--;

    if (b.timer <= 0) {
      b.castingTimer = 40;
      const r = Math.random();
      if (r < 0.36) {
        for (let k = 0; k < 5; k++) {
          const ang = (Math.PI * 0.15) + (k * Math.PI * 0.175);
          b.projectiles.push({
            x: cx, y: cy - 35,
            vx: Math.cos(ang) * 4.1,
            vy: Math.sin(ang) * 4.1,
            r: 8, isPink: k === 2
          });
        }
        b.timer = 55;
      } else if (r < 0.72) {
        spawnDiagonalLightning(b);
        spawnDiagonalLightning(b);
        b.timer = 58;
      } else {
        if (b.minions.length < 4) spawnColoredMinions(b, 2);
        b.timer = 60;
      }
    }
  }

  for (let i = b.minions.length - 1; i >= 0; i--) {
    const m = b.minions[i];
    m.x += m.vx;
    m.vy += 0.25;
    m.y += m.vy;
    if (m.y + m.r >= 300) {
      m.y = 300 - m.r;
      m.vy = -5.5;
    }
    if (m.x - m.r < 30 || m.x + m.r > 770) m.vx *= -1;

    m.shootTimer--;
    if (m.shootTimer <= 0) {
      m.shootTimer = 115;
      const ang = Math.atan2((player.y + 14) - m.y, (player.x + 10) - m.x);
      b.projectiles.push({
        x: m.x, y: m.y,
        vx: Math.cos(ang) * 3.2,
        vy: Math.sin(ang) * 3.2,
        r: 6, isPink: false
      });
    }

    if (rectIntersect(player.x, player.y, player.w, player.h, m.x - m.r + 3, m.y - m.r + 3, m.r * 2 - 6, m.r * 2 - 6)) {
      damagePlayer();
    }
  }

  for (let i = b.lightnings.length - 1; i >= 0; i--) {
    const lt = b.lightnings[i];
    if (lt.warnTimer > 0) {
      lt.warnTimer--;
      if (lt.warnTimer === 0) {
        sfxLightning();
        shakeTimer = 10;
      }
    } else {
      lt.activeTimer--;
      if (!lt.hitDone) {
        const dist = pointToSegmentDist(player.x + 10, player.y + 14, lt.topX, 0, lt.botX, 300);
        if (dist < 18) {
          lt.hitDone = true;
          damagePlayer();
        }
      }
      if (lt.activeTimer <= 0) b.lightnings.splice(i, 1);
    }
  }

  for (let i = b.projectiles.length - 1; i >= 0; i--) {
    const pr = b.projectiles[i];
    pr.x += pr.vx;
    pr.y += pr.vy;
    if (pr.x < -20 || pr.x > 820 || pr.y > 460 || pr.y < -20) {
      b.projectiles.splice(i, 1);
      continue;
    }
    if (rectIntersect(player.x, player.y, player.w, player.h, pr.x - pr.r, pr.y - pr.r, pr.r * 2, pr.r * 2)) {
      if (pr.isPink && player.parryTimer > 0) {
        sfxParry();
        player.vy = -7.5;
        player.parryTimer = 0;
        addShockwave(pr.x, pr.y, '#ff007f');
        spawnFloatingText(pr.x, pr.y - 12, 'PARRY!', '#ff007f');
        damageBoss(b, 20, cx, cy);
        b.projectiles.splice(i, 1);
      } else {
        damagePlayer();
        b.projectiles.splice(i, 1);
      }
    }
  }

  if (rectIntersect(player.x, player.y, player.w, player.h, b.x + 8, b.y + 8, b.w - 16, b.h - 16)) {
    damagePlayer();
  }
}

// =========================================================================
// UPDATE GERAL (60 FPS)
// =========================================================================
function update() {
  if (dialog.open) return;
  if (chestAnim.active) { chestAnim.timer--; if (chestAnim.timer <= 0) chestAnim.active = false; return; }
  if (crateAnim.active) { crateAnim.timer--; if (crateAnim.timer <= 0) crateAnim.active = false; return; }
  if (screen !== 'playing') return;
  if (paused) return;

  if(level.arena && trail?.away && trail.exit<100){stepTrail();return;}
  if (shakeTimer > 0) shakeTimer--;
  if (bossBannerTimer > 0) bossBannerTimer--;
  if (knockoutTimer > 0) knockoutTimer--;
  if (spawnAnimTimer > 0) spawnAnimTimer--;
  shootCooldown = Math.max(-0.999999, shootCooldown - 1);
  if (weaponRecoil > 0) weaponRecoil -= 0.4;
  if (muzzleFlashTimer > 0) muzzleFlashTimer--;
  if (player.invulnTimer > 0) player.invulnTimer--;
  if (player.parryTimer > 0) player.parryTimer--;

  if (mouse.down && level && level.isBoss && shootCooldown <= 0) {
    tryPlayerShoot(true);
  } else if ((arrowAim() !== null || touchHeld('fire') || keys['KeyJ'] || keys['KeyZ']) && level && level.isBoss && shootCooldown <= 0) {
    tryPlayerShoot(false);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.16; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 0.65; ft.life--;
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.r += 2.6; sw.alpha -= 0.06;
    if (sw.alpha <= 0) shockwaves.splice(i, 1);
  }

  if (deadTimer > 0) {
    deadTimer--;
    if (deadTimer === 0) {
      const room=level.expedition.trick;
      if(room){
        Object.assign(player,room.checkpoint,{vx:0,vy:0,grounded:false,dashFrames:0,jumpBuffer:0,coyoteTimer:0,invulnTimer:80});
        room.hold=0;player.supportTile=null;player.landedOn=null;player.launchedFrom=null;
        if(room.kind==='signal'&&room.step){room.clock=0;room.safe={...room.checkpoint};}
        if(room.kind==='firefly'&&room.step){room.trail=[];room.light={x:player.x+10,y:player.y};}
        if(room.kind==='press'&&room.step===1){room.step=0;room.t=0;}
        spawnAnimTimer=12;
      }else startLevel(currentLevel);
    }
    return;
  }

  if (enterDoorTimer > 0) {
    enterDoorTimer--;
    player.x += (level.door.x + 4 - player.x) * 0.22;
    if (enterDoorTimer === 0) {
      if (currentLevel + 1 < TOTAL_LEVELS) {
        mapPage = Math.floor((currentLevel + 1) / 20);
        startLevel(currentLevel + 1);
      } else {
        goMap();
      }
    }
    return;
  }

  levelTime++;
  for (let p of level.platforms) {
    if (p.type === 'moving') {
      p.phase += p.moveSpeed;
      const prevX = p.x;
      const prevY = p.y;
      if (p.moveAxis === 'x') p.x = p.baseX + Math.sin(p.phase) * p.moveRange;
      else p.y = p.baseY + Math.sin(p.phase) * p.moveRange;
      p.dx = p.x - prevX;
      p.dy = p.y - prevY;

      const onTop = (player.y + player.h >= prevY - 3 && player.y + player.h <= prevY + 8) &&
                    (player.x + player.w > p.x && player.x < p.x + p.w);
      if (onTop && player.vy >= 0) {
        player.y = p.y - player.h;
        player.x += p.dx;
      }
    } else if (p.type === 'crumble' && p.crumbleTimer > 0 && !p.fallen) {
      p.crumbleTimer--;
      if (p.crumbleTimer === 0) {
        p.fallen = true;
        spawnParticles(p.x + p.w / 2, p.y + 8, '#8d5524', 12, 3);
      }
    } else if (p.type === 'blink') {
      p.blinkTimer++;
    }
  }

  for (let sp of level.springs) {
    if (sp.bounceAnim > 0) sp.bounceAnim--;
  }

  for (let cn of level.cannons) {
    cn.timer--;
    if (cn.timer <= 0) {
      cn.timer = cn.interval;
      level.darts.push({ x: cn.x - 10, y: cn.y + 6, w: 12, h: 5, vx: -4.2 });
    }
  }
  for (let i = level.darts.length - 1; i >= 0; i--) {
    const dt = level.darts[i];
    dt.x += dt.vx;
    if (dt.x < -20) { level.darts.splice(i, 1); continue; }
    if (rectIntersect(player.x, player.y, player.w, player.h, dt.x, dt.y, dt.w, dt.h)) {
      damagePlayer();
      level.darts.splice(i, 1);
    }
  }

  for (let rk of level.fallingRocks) {
    if (rk.state === 'idle' && Math.abs((player.x + 10) - (rk.x + 8)) < 36) {
      rk.state = 'shake';
      rk.timer = 18;
    } else if (rk.state === 'shake') {
      rk.timer--;
      if (rk.timer <= 0) rk.state = 'fall';
    } else if (rk.state === 'fall') {
      rk.vy += 0.45;
      rk.y += rk.vy;
      if (rectIntersect(player.x, player.y, player.w, player.h, rk.x + 2, rk.y + 2, rk.w - 4, rk.h - 4)) {
        damagePlayer();
        rk.state = 'broken';
      }
      if (rk.y > 450) rk.state = 'broken';
    }
  }

  const moveLeft = touchHeld('left') || keys['ArrowLeft'] || keys['KeyA'];
  const moveRight = touchHeld('right') || keys['ArrowRight'] || keys['KeyD'];
  let targetVx = 0;
  if (moveLeft) {
    targetVx = -player.speed;
    if (!level.isBoss || !mouse.active) player.facing = -1;
  }
  if (moveRight) {
    targetVx = player.speed;
    if (!level.isBoss || !mouse.active) player.facing = 1;
  }

  player.vx += (targetVx - player.vx) * (player.grounded && player.onIce ? 0.1 : 0.35);
  if (Math.abs(player.vx) < 0.1) player.vx = 0;
  if (Math.abs(player.vx) > 0.4 && player.grounded) player.walkAnim += Math.abs(player.vx)*0.095;
  else player.walkAnim = 0;

  if (player.dashFrames > 0) {
    player.vx = player.dashDir * 6.4;

    if (player.dashFrames % 2 === 0) spawnParticles(player.x + 10, player.y + 14, '#65efdc', 2, 1.1);
    player.dashFrames--;
  }
  const breeze=level.expedition.trick;
  if(breeze?.run==='wind'&&!player.grounded && player.x+player.w>breeze.tile.x-18 && player.x<breeze.tile.x+breeze.tile.w+18)
    player.x+=levelTime%240<120 ? .5 : -.5;
  player.x += player.vx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > 800) player.x = 800 - player.w;

  for (let p of level.platforms) {
    if (p.fallen) continue;
    if (p.type === 'blink' && (p.blinkTimer % 180) >= 110) continue;
    if (p.oneWay) continue;
    if (p.type === 'moving' && (player.y + player.h) <= p.y + 8) continue;
    if (rectIntersect(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) {
      if (player.vx > 0) player.x = p.x - player.w;
      else if (player.vx < 0) player.x = p.x + p.w;
    }
  }

  if(level.training?.lesson===0 && (moveLeft || moveRight) && Math.abs(player.x-level.spawn.x)>=12)passTrainingStep(0);
  player.launchedFrom=null;player.landedOn=null;
  if (player.grounded) player.coyoteTimer = 6;
  else if (player.coyoteTimer > 0) player.coyoteTimer--;
  if (player.jumpBuffer > 0) player.jumpBuffer--;

  if (player.jumpBuffer > 0 && player.coyoteTimer > 0) {
    if(player.grounded)player.launchedFrom=player.supportTile;
    player.vy = player.jumpPower;
    passTrainingStep(1);
    player.grounded = false;
    player.coyoteTimer = 0;
    player.jumpBuffer = 0;
    player.squashX = 0.78;
    player.squashY = 1.24;
    sfxJump();
    player.jumping = true;
    spawnParticles(player.x + 10, player.y + player.h, '#d8c8a8', 5, 1.6);

  }

  const moon=level.expedition.trick;
  player.vy += moon?.kind==='moon' && moon.step ? .24 : .44;
  if (player.vy > 10) player.vy = 10;
  player.y += player.vy;

  const wasGrounded = player.grounded;
  player.grounded = false;
  for (let p of level.platforms) {
    if (p.fallen) continue;
    if (p.type === 'blink' && (p.blinkTimer % 180) >= 110) continue;
    if (rectIntersect(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) {
      if (player.vy >= 0 && (player.y + player.h - player.vy) <= p.y + (p.oneWay ? 0.01 : 8)) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.grounded = true;player.supportTile=p;
        if(!wasGrounded)player.landedOn=p;
        player.onIce = !!p.ice;
        if (!wasGrounded) { player.squashX = 1.22; player.squashY = 0.8; player.jumping = false; if (player.vy === 0) spawnParticles(player.x + 10, player.y + player.h, '#d8c8a8', 6, 2); }
        if (p.type === 'crumble' && p.crumbleTimer === 0) p.crumbleTimer = 28;
      } else if (!p.oneWay && player.vy < 0 && (player.y - player.vy) >= p.y + p.h - 8) {
        const c=level.expedition;
        if(c.trick?.block===p){
          p.fallen=true;c.done=true;level.door.open=true;c.trick.hint='Tijolo quebrado. Entre na porta!';
          sfxKey();addShockwave(p.x+16,p.y+6,'#ffd166');
        }
        player.y = p.y + p.h;
        player.vy = 0;
      }
    }
  }

  stepRoom();
  stepTrail();
  if (player.grounded && !player.dashFrames) player.dashReady = true;
  player.squashX += (1 - player.squashX) * 0.22;
  player.squashY += (1 - player.squashY) * 0.22;

  for (let sp of level.springs) {
    if (rectIntersect(player.x, player.y, player.w, player.h, sp.x, sp.y, sp.w, sp.h)) {
      player.vy = -12.6;
      player.grounded = false;
      sp.bounceAnim = 12;
      player.squashX = 0.72;
      player.squashY = 1.32;
      sfxSpring();
      spawnParticles(sp.x + 11, sp.y, '#ffd166', 10, 3);
    }
  }

  if (level.levelChest && !level.levelChest.opened) {
    const ch = level.levelChest;
    if (rectIntersect(player.x, player.y, player.w, player.h, ch.x, ch.y, ch.w, ch.h)) {
      ch.opened = true;
      addShockwave(ch.x + 14, ch.y + 11, '#ffd166');
      spawnParticles(ch.x + 14, ch.y + 11, '#ffd166', 24, 4.2);
      triggerChestReward(`Baú Secreto da Fase ${currentLevel + 1}`);
    }
  }

  if (level.keyItem && !level.keyItem.collected) {
    const k = level.keyItem;
    if (rectIntersect(player.x, player.y, player.w, player.h, k.x - 10, k.y - 10, 20, 20)) {
      k.collected = true;
      level.door.open = true;
      sfxKey();
      addShockwave(k.x, k.y, '#ffd166');
      spawnFloatingText(k.x, k.y - 12, 'PORTAL ABERTO!', '#ffd166');
    }
  }

  for (let s of level.spikes) {
    if (s.hidden && !s.triggered) {
      if (Math.abs((player.x + 10) - (s.x + s.w / 2)) < s.triggerDist && Math.abs(player.y - s.y) < 55) {
        s.triggered = true;
      }
    }
    if (!s.hidden || s.triggered) {
      if (rectIntersect(player.x + 3, player.y + 3, player.w - 6, player.h - 4, s.x + 2, s.y + 2, s.w - 4, s.h - 2)) {
        damagePlayer();
      }
    }
  }

  for (let saw of level.saws) {
    saw.x += saw.vx;
    if (saw.x - saw.r < saw.minX || saw.x + saw.r > saw.maxX) saw.vx *= -1;
    if (bladeTouches(saw.x,saw.y,saw.r)) {
      damagePlayer();
    }
  }

  for (const v of level.vents || []) { v.t = (v.t + 1) % 150; v.on = v.t >= 90 && v.t < 125; if (v.on && rectIntersect(player.x + 3, player.y + 3, player.w - 6, player.h - 6, v.x, v.y - 70, v.w, 70)) damagePlayer(); }
  for (const m of level.maces || []) { m.ph += m.sp; const an = Math.sin(m.ph) * 0.8; m.bx = m.ax + Math.sin(an) * m.len; m.by = m.ay + Math.cos(an) * m.len; if (bladeTouches(m.bx,m.by,14)) damagePlayer(); }
  updatePetCompanion();

  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const pb = playerBullets[i];
    pb.age++;
    if (pb.homing && level.isBoss && level.boss && level.boss.hp > 0) {
      const b = level.boss;
      const desired = Math.atan2((b.y + b.h / 2) - pb.y, (b.x + b.w / 2) - pb.x);
      const spd = Math.hypot(pb.vx, pb.vy);
      pb.vx += (Math.cos(desired) * spd - pb.vx) * 0.08;
      pb.vy += (Math.sin(desired) * spd - pb.vy) * 0.08;
    }
    pb.x += pb.vx;
    pb.y += pb.vy;

    if (pb.x < -20 || pb.x > 820 || pb.y < -20 || pb.y > 460) {
      playerBullets.splice(i, 1);
      continue;
    }
    if (level.isBoss && level.boss && level.boss.hp > 0) {
      const b = level.boss;
      let hitMinion = false;
      for (let mIdx = b.minions.length - 1; mIdx >= 0; mIdx--) {
        const m = b.minions[mIdx];
        if (rectIntersect(pb.x - pb.r, pb.y - pb.r, pb.r * 2, pb.r * 2, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2)) {
          m.hp -= pb.damage;
          spawnParticles(pb.x, pb.y, m.palette.main, 7, 3);
          if (m.hp <= 0) {
            addShockwave(m.x, m.y, m.palette.main);
            b.minions.splice(mIdx, 1);
          }
          playerBullets.splice(i, 1);
          hitMinion = true;
          break;
        }
      }
      if (hitMinion) continue;

      if (rectIntersect(pb.x - pb.r, pb.y - pb.r, pb.r * 2, pb.r * 2, b.x, b.y, b.w, b.h)) {
        const isExplosive = pb.style === 'cannon';
        damageBoss(b, pb.damage, pb.x, pb.y, isExplosive);
        if (isExplosive) {
          for (let mIdx = b.minions.length - 1; mIdx >= 0; mIdx--) {
            const m = b.minions[mIdx];
            if (Math.hypot(m.x - pb.x, m.y - pb.y) < 60) {
              m.hp -= pb.damage * 0.7;
              if (m.hp <= 0) b.minions.splice(mIdx, 1);
            }
          }
        }
        playerBullets.splice(i, 1);
      }
    }
  }

  for (let i = petBullets.length - 1; i >= 0; i--) {
    const ptb = petBullets[i];
    ptb.x += ptb.vx;
    ptb.y += ptb.vy;
    if (ptb.x < -20 || ptb.x > 820 || ptb.y < -20 || ptb.y > 460) {
      petBullets.splice(i, 1);
      continue;
    }
    if (level.isBoss && level.boss && level.boss.hp > 0) {
      const b = level.boss;
      let hitMinion = false;
      for (let mIdx = b.minions.length - 1; mIdx >= 0; mIdx--) {
        const m = b.minions[mIdx];
        if (rectIntersect(ptb.x - ptb.r, ptb.y - ptb.r, ptb.r * 2, ptb.r * 2, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2)) {
          m.hp -= ptb.damage;
          spawnParticles(ptb.x, ptb.y, ptb.color, 4, 2);
          if (m.hp <= 0) b.minions.splice(mIdx, 1);
          petBullets.splice(i, 1);
          hitMinion = true;
          break;
        }
      }
      if (hitMinion) continue;

      if (rectIntersect(ptb.x - ptb.r, ptb.y - ptb.r, ptb.r * 2, ptb.r * 2, b.x, b.y, b.w, b.h)) {
        damageBoss(b, ptb.damage, ptb.x, ptb.y, false);
        petBullets.splice(i, 1);
      }
    }
  }

  if (level.isBoss && level.boss && level.boss.hp > 0) updateBossFight(level.boss);

  if (player.y > 455) killPlayer(false);

  if (!deadTimer && level.expedition.done && level.door.open && rectIntersect(player.x, player.y, player.w, player.h, level.door.x, level.door.y, level.door.w, level.door.h)) {
    completeLevel();
  }
}
// =========================================================================
// REFERÊNCIA GAMER ÚNICA & BAÚ DO TESOURO 16-BIT DE ALTA QUALIDADE
// =========================================================================
function drawReferenceProp(prop) {
  if (!prop) return;
  const x = Math.round(prop.x);
  const y = Math.round(prop.y);
  const t = Date.now() * 0.005;
  ctx.save();

  if (prop.type === 'mario_block') {
    const bob = Math.round(Math.sin(t) * 2);
    const by = y - 42 + bob;
    ctx.fillStyle = '#140c07';
    ctx.fillRect(x, by, 18, 18);
    ctx.fillStyle = '#ff9e00';
    ctx.fillRect(x + 1, by + 1, 16, 16);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x + 1, by + 1, 15, 2);
    ctx.fillRect(x + 1, by + 1, 2, 15);
    ctx.fillStyle = '#583101';
    ctx.fillRect(x + 2, by + 2, 2, 2);
    ctx.fillRect(x + 14, by + 2, 2, 2);
    ctx.fillRect(x + 2, by + 14, 2, 2);
    ctx.fillRect(x + 14, by + 14, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 6, by + 4, 6, 2);
    ctx.fillRect(x + 10, by + 6, 2, 3);
    ctx.fillRect(x + 8, by + 9, 3, 2);
    ctx.fillRect(x + 8, by + 13, 2, 2);
  } else if (prop.type === 'zelda_triforce') {
    const bob = Math.round(Math.sin(t * 1.2) * 3);
    const ty = y - 28 + bob;
    ctx.fillStyle = '#140c07';
    ctx.fillRect(x - 1, ty + 14, 22, 5);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x + 8, ty, 4, 3);
    ctx.fillRect(x + 6, ty + 3, 8, 3);
    ctx.fillRect(x + 4, ty + 6, 12, 3);
    ctx.fillRect(x + 4, ty + 9, 4, 3);
    ctx.fillRect(x + 2, ty + 12, 8, 3);
    ctx.fillRect(x, ty + 15, 10, 3);
    ctx.fillRect(x + 12, ty + 9, 4, 3);
    ctx.fillRect(x + 10, ty + 12, 8, 3);
    ctx.fillRect(x + 10, ty + 15, 10, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 9, ty + 2, 2, 2);
  } else if (prop.type === 'master_sword') {
    ctx.fillStyle = '#140c07';
    ctx.fillRect(x + 2, y - 8, 20, 8);
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(x + 3, y - 7, 18, 6);
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(x + 5, y - 6, 14, 3);
    ctx.fillStyle = '#e5e5e5';
    ctx.fillRect(x + 10, y - 20, 4, 13);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 11, y - 20, 1, 12);
    ctx.fillStyle = '#3a0ca3';
    ctx.fillRect(x + 6, y - 22, 12, 3);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x + 11, y - 22, 2, 2);
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(x + 10, y - 27, 4, 5);
  } else if (prop.type === 'minecraft_sword') {
    ctx.fillStyle = '#140c07';
    ctx.fillRect(x + 13, y - 23, 6, 6);
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(x + 14, y - 22, 4, 4);
    ctx.fillRect(x + 12, y - 20, 4, 4);
    ctx.fillRect(x + 10, y - 18, 4, 4);
    ctx.fillRect(x + 8, y - 16, 4, 4);
    ctx.fillStyle = '#90e0ef';
    ctx.fillRect(x + 15, y - 21, 2, 2);
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(x + 4, y - 14, 4, 4);
    ctx.fillRect(x + 10, y - 8, 4, 4);
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(x + 4, y - 8, 4, 4);
    ctx.fillRect(x + 2, y - 6, 4, 4);
  } else if (prop.type === 'sonic_ring') {
    const squeeze = Math.max(2, Math.round(Math.abs(Math.cos(t * 1.6)) * 7));
    const ry = y - 22;
    ctx.fillStyle = '#140c07';
    ctx.fillRect(x + 9 - squeeze, ry - 1, squeeze * 2 + 2, 16);
    ctx.fillStyle = '#ff9e00';
    ctx.fillRect(x + 10 - squeeze, ry, squeeze * 2, 14);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x + 10 - squeeze + 1, ry + 1, Math.max(1, squeeze * 2 - 2), 12);
    if (squeeze > 3) {
      ctx.fillStyle = '#140c07';
      ctx.fillRect(x + 10 - (squeeze - 3), ry + 3, (squeeze - 3) * 2, 8);
    }
  } else if (prop.type === 'darksouls_bonfire') {
    ctx.fillStyle = '#3d2100';
    ctx.fillRect(x + 2, y - 4, 18, 4);
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(x + 4, y - 6, 5, 3);
    ctx.fillRect(x + 13, y - 6, 5, 3);
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(x + 10, y - 20, 2, 16);
    ctx.fillRect(x + 7, y - 17, 8, 2);
    const flick = Math.round(Math.sin(t * 3) * 2);
    ctx.fillStyle = '#ff5400';
    ctx.fillRect(x + 5, y - 13 - flick, 12, 9 + flick);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x + 7, y - 10 - flick, 8, 6 + flick);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 9, y - 7, 4, 3);
  } else if (prop.type === 'pokeball') {
    const py = y - 14;
    ctx.fillStyle = '#140c07';
    ctx.fillRect(x + 2, py, 14, 14);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(x + 3, py + 1, 12, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 3, py + 8, 12, 5);
    ctx.fillStyle = '#140c07';
    ctx.fillRect(x + 3, py + 6, 12, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 7, py + 5, 4, 4);
  } else if (prop.type === 'terraria_crystal') {
    const pulse = Math.sin(t * 2) > 0 ? '#ff4d6d' : '#ff0055';
    const cy = y - 18;
    ctx.fillStyle = '#140c07';
    ctx.fillRect(x + 2, cy + 2, 14, 12);
    ctx.fillStyle = pulse;
    ctx.fillRect(x + 3, cy + 1, 5, 5);
    ctx.fillRect(x + 10, cy + 1, 5, 5);
    ctx.fillRect(x + 2, cy + 4, 14, 5);
    ctx.fillRect(x + 4, cy + 9, 10, 4);
    ctx.fillRect(x + 7, cy + 13, 4, 3);
    ctx.fillStyle = '#ffccd5';
    ctx.fillRect(x + 4, cy + 2, 2, 2);
  }

  ctx.restore();
}

// =========================================================================
// BAÚ DO TESOURO 16-BIT DE ALTA QUALIDADE
// =========================================================================
function drawDetailedChestSprite(c, cx, cy, scale = 1, openRatio = 0) {
  c.save();
  c.translate(Math.round(cx), Math.round(cy));
  c.scale(scale, scale);

  c.fillStyle = 'rgba(0, 0, 0, 0.45)';
  c.fillRect(-16, 10, 32, 4);

  c.fillStyle = '#140c07';
  c.fillRect(-15, -2, 30, 14);
  c.fillStyle = '#583101';
  c.fillRect(-13, 0, 26, 10);
  c.fillStyle = '#7f4f24';
  c.fillRect(-11, 0, 22, 8);
  c.fillStyle = '#3d2100';
  c.fillRect(-5, 0, 1, 10);
  c.fillRect(4, 0, 1, 10);

  c.fillStyle = '#d48c00';
  c.fillRect(-14, 0, 3, 10);
  c.fillRect(11, 0, 3, 10);
  c.fillRect(-14, 8, 28, 3);
  c.fillStyle = '#ffd166';
  c.fillRect(-13, 0, 1, 9);
  c.fillRect(12, 0, 1, 9);

  if (openRatio > 0.05) {
    c.fillStyle = '#ff9e00';
    c.fillRect(-12, -3, 24, 5);
    c.fillStyle = '#ffd166';
    c.fillRect(-10, -4, 20, 4);
    c.fillStyle = '#ffffff';
    c.fillRect(-7, -4, 14, 2);
  }

  const lidLift = Math.round(openRatio * 10);
  const lidShrink = Math.round(openRatio * 3);
  const lidY = -12 - lidLift;
  const lidH = Math.max(5, 11 - lidShrink);

  c.fillStyle = '#140c07';
  c.fillRect(-16, lidY, 32, lidH + 2);
  c.fillStyle = '#7f4f24';
  c.fillRect(-14, lidY + 1, 28, lidH);
  c.fillStyle = '#9c6644';
  c.fillRect(-12, lidY + 2, 24, Math.max(2, lidH - 4));

  c.fillStyle = '#d48c00';
  c.fillRect(-15, lidY + 1, 3, lidH);
  c.fillRect(12, lidY + 1, 3, lidH);
  c.fillRect(-15, lidY + lidH - 1, 30, 2);
  c.fillStyle = '#ffd166';
  c.fillRect(-14, lidY + 1, 28, 2);
  c.fillStyle = '#ffffff';
  c.fillRect(-11, lidY + 1, 8, 1);

  const lockY = -4 - Math.round(lidLift * 0.6);
  c.fillStyle = '#140c07';
  c.fillRect(-4, lockY, 8, 9);
  c.fillStyle = '#ffd166';
  c.fillRect(-3, lockY + 1, 6, 7);
  c.fillStyle = '#e63946';
  c.fillRect(-1, lockY + 3, 2, 3);
  c.fillStyle = '#ffffff';
  c.fillRect(-1, lockY + 3, 1, 1);

  c.restore();
}

function drawLevelChest(ch) {
  if (!ch || ch.opened) return;
  const cx = ch.x + ch.w / 2;
  const cy = ch.y + ch.h / 2;
  const t = Date.now() * 0.006;
  const pulse = Math.sin(t) * 0.5 + 0.5;

  ctx.save();
  ctx.fillStyle = `rgba(255, 209, 102, ${0.18 + pulse * 0.18})`;
  ctx.fillRect(ch.x - 6, ch.y - 6, ch.w + 12, ch.h + 8);

  drawDetailedChestSprite(ctx, cx, cy, 1.0, 0);

  const sparkY = Math.round((t * 14) % 16);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 8, ch.y - 2 - sparkY, 2, 2);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(cx + 7, ch.y - 6 - ((sparkY + 7) % 16), 2, 2);
  ctx.restore();
}

// =========================================================================
// ARTE PIXEL ART PROFISSIONAL DOS PETS E OVOS
// =========================================================================
function drawPetSprite(c, cx, cy, pet, scale = 1) {
  if (!pet) return;
  c.save();
  c.translate(Math.round(cx), Math.round(cy));
  c.scale(scale, scale);

  if (pet.style === 'slime') {
    c.fillStyle = '#140c07';
    c.fillRect(-10, -8, 20, 16);
    c.fillStyle = pet.bodyColor;
    c.fillRect(-9, -7, 18, 14);
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.fillRect(-9, 3, 18, 4);
    c.fillStyle = pet.accent;
    c.fillRect(-7, -6, 12, 3);
    c.fillStyle = '#ffffff';
    c.fillRect(-6, -5, 4, 2);
    c.fillStyle = pet.eyeColor;
    c.fillRect(-4, -2, 2, 4);
    c.fillRect(3, -2, 2, 4);
  } else if (pet.style === 'fairy') {
    const flap = Math.sin(Date.now() * 0.025) * 2;
    c.fillStyle = '#140c07';
    c.fillRect(-12, -8 + flap, 8, 6);
    c.fillRect(4, -8 + flap, 8, 6);
    c.fillStyle = '#ffffff';
    c.fillRect(-11, -7 + flap, 6, 4);
    c.fillRect(5, -7 + flap, 6, 4);
    c.fillRect(-9, 1, 5, 3);
    c.fillRect(4, 1, 5, 3);
    c.fillStyle = pet.accent;
    c.fillRect(-6, -6, 12, 12);
    c.fillStyle = pet.bodyColor;
    c.fillRect(-5, -5, 10, 10);
    c.fillStyle = '#ffffff';
    c.fillRect(-3, -3, 6, 6);
  } else if (pet.style === 'creeper') {
    c.fillStyle = '#140c07';
    c.fillRect(-9, -9, 18, 18);
    c.fillStyle = pet.bodyColor;
    c.fillRect(-8, -8, 16, 16);
    c.fillStyle = pet.accent;
    c.fillRect(-7, -7, 5, 5);
    c.fillRect(2, 2, 5, 5);
    c.fillStyle = '#1b4332';
    c.fillRect(-8, 5, 16, 3);
    c.fillStyle = pet.eyeColor;
    c.fillRect(-5, -4, 3, 3);
    c.fillRect(2, -4, 3, 3);
    c.fillRect(-2, -1, 4, 3);
    c.fillRect(-4, 1, 2, 4);
    c.fillRect(2, 1, 2, 4);
  } else if (pet.style === 'ghost') {
    c.fillStyle = '#140c07';
    c.fillRect(-9, -9, 18, 17);
    c.fillStyle = pet.bodyColor;
    c.fillRect(-8, -8, 16, 14);
    c.fillRect(-6, 6, 3, 3);
    c.fillRect(3, 6, 3, 3);
    c.fillStyle = '#cbd5e1';
    c.fillRect(-8, 3, 16, 3);
    c.fillStyle = pet.eyeColor;
    c.fillRect(-4, -3, 2, 4);
    c.fillRect(2, -3, 2, 4);
    c.fillStyle = pet.accent;
    c.fillRect(-6, 1, 3, 2);
    c.fillRect(3, 1, 3, 2);
  } else if (pet.style === 'chao') {
    c.fillStyle = '#140c07';
    c.fillRect(-8, -8, 16, 16);
    c.fillStyle = pet.bodyColor;
    c.fillRect(-7, -7, 14, 14);
    c.fillStyle = '#90e0ef';
    c.fillRect(-5, -6, 10, 3);
    c.fillStyle = pet.accent;
    c.fillRect(-2, -12, 4, 5);
    c.fillStyle = pet.eyeColor;
    c.fillRect(-4, -3, 2, 4);
    c.fillRect(2, -3, 2, 4);
    c.fillStyle = '#ffffff';
    c.fillRect(-4, -3, 1, 1);
    c.fillRect(2, -3, 1, 1);
  } else if (pet.style === 'kirby') {
    c.fillStyle = '#140c07';
    c.fillRect(-9, -8, 18, 16);
    c.fillStyle = pet.bodyColor;
    c.fillRect(-8, -7, 16, 14);
    c.fillStyle = '#ffccd5';
    c.fillRect(-6, -6, 10, 3);
    c.fillStyle = pet.accent;
    c.fillRect(-8, 5, 6, 3);
    c.fillRect(2, 5, 6, 3);
    c.fillStyle = pet.eyeColor;
    c.fillRect(-3, -3, 2, 4);
    c.fillRect(2, -3, 2, 4);
    c.fillStyle = '#ffffff';
    c.fillRect(-3, -3, 1, 1);
    c.fillRect(2, -3, 1, 1);
  } else if (pet.style === 'pikachu') {
    c.fillStyle = '#140c07';
    c.fillRect(-8, -13, 4, 6);
    c.fillRect(4, -13, 4, 6);
    c.fillRect(-9, -8, 18, 16);
    c.fillStyle = pet.bodyColor;
    c.fillRect(-7, -11, 2, 5);
    c.fillRect(5, -11, 2, 5);
    c.fillRect(-8, -7, 16, 14);
    c.fillStyle = '#fff3b0';
    c.fillRect(-6, -6, 10, 3);
    c.fillStyle = pet.eyeColor;
    c.fillRect(-4, -3, 2, 3);
    c.fillRect(2, -3, 2, 3);
    c.fillStyle = '#ffffff';
    c.fillRect(-4, -3, 1, 1);
    c.fillRect(2, -3, 1, 1);
    c.fillStyle = pet.accent;
    c.fillRect(-7, 0, 3, 3);
    c.fillRect(4, 0, 3, 3);
  } else if (pet.style === 'metroid') {
    c.fillStyle = '#140c07';
    c.fillRect(-10, -9, 20, 15);
    c.fillStyle = pet.bodyColor;
    c.fillRect(-9, -8, 18, 13);
    c.fillStyle = pet.accent;
    c.fillRect(-7, -7, 14, 3);
    c.fillStyle = '#ffffff';
    c.fillRect(-5, -6, 6, 1);
    c.fillStyle = pet.eyeColor;
    c.fillRect(-5, -2, 4, 5);
    c.fillRect(1, -2, 4, 5);
    c.fillStyle = '#ffd166';
    c.fillRect(-7, 5, 2, 4);
    c.fillRect(-1, 5, 2, 4);
    c.fillRect(5, 5, 2, 4);
  }

  c.restore();
}

function drawEggIcon(c, cx, cy, shellColor, spotColor) {
  c.save();
  c.translate(Math.round(cx), Math.round(cy));
  c.fillStyle = '#140c07';
  c.fillRect(-8, -14, 16, 4);
  c.fillRect(-12, -10, 24, 6);
  c.fillRect(-14, -4, 28, 12);
  c.fillRect(-10, 8, 20, 4);

  c.fillStyle = shellColor;
  c.fillRect(-6, -12, 12, 4);
  c.fillRect(-10, -8, 20, 6);
  c.fillRect(-12, -2, 24, 10);
  c.fillRect(-8, 8, 16, 2);

  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.fillRect(-10, 5, 20, 4);

  c.fillStyle = '#ffffff';
  c.fillRect(-7, -9, 3, 6);

  c.fillStyle = spotColor;
  c.fillRect(-4, -2, 5, 5);
  c.fillRect(4, -5, 4, 4);
  c.fillRect(2, 3, 5, 4);
  c.restore();
}

// =========================================================================
// RENDERIZADOR DE ARMAS DETALHADAS POR ESTILO
// =========================================================================
// Cada combinação de silhueta e movimento tem sua própria animação.
function drawShotEffect(c, id, age, muzzle = false) {
  const shape = id % 12, motion = Math.floor(id / 12);
  const t = age * (0.24 + motion * 0.018), wave = Math.sin(t);
  const colors = ['#ffe976','#75eaff','#ffa15c','#ff78ab','#9dff83','#afacff','#ffba67','#61ffd2','#f899ff','#ccefff','#e3ff74','#ff7971'];
  c.save();
  if (muzzle) { c.scale(0.85, 0.85); c.scale(1 + age/16, 1 - age/12); }
  c.fillStyle = colors[(shape + motion) % colors.length];
  c.strokeStyle = c.fillStyle; c.lineWidth = 1.5;
  const line = (points, fill = false) => {
    c.beginPath(); c.moveTo(...points[0]);
    for (const point of points.slice(1)) c.lineTo(...point);
    if (fill) { c.closePath(); c.fill(); } else c.stroke();
  };
  const ring = (x,y,r) => { c.beginPath(); c.arc(x,y,r,0,2*Math.PI); c.stroke(); };
  switch (motion) {
    case 0: c.scale(1+0.15*wave,1); break;
    case 1: c.rotate(0.38*wave); break;
    case 2: ring(-6,0,2+Math.abs(wave)*3); break;
    case 3: c.fillRect(-9,3*wave,4,2); c.fillRect(-12,-3*wave,3,2); break;
    case 4: c.rotate(t); break;
    case 5: c.scale(1,0.45+Math.abs(wave)); break;
    case 6: line([[-13,0],[-9,3*wave],[-5,-3*wave],[0,0]]); break;
    case 7: c.fillRect(4*Math.cos(t),5*wave,3,3); break;
    case 8: for(let j=1;j<=3;j++) c.fillRect(-4*j,Math.sin(t+j)*3,2,2); break;
    case 9: c.rotate(-t); ring(0,0,6); break;
    case 10: line([[-11,4*wave],[-5,0],[-11,-4*wave]]); c.scale(1+0.2*wave,1); break;
  }
  switch (shape) {
    case 0: line([[-6,-3],[7,0],[-6,3],[-3,0]],true); break;
    case 1: ring(0,0,3.5); break;
    case 2: line([[-6,0],[0,-4],[6,0],[0,4]],true); break;
    case 3: line([[-7,2],[-2,-3],[0,1],[6,-2]]); break;
    case 4: c.fillRect(-6,-3,10,2); c.fillRect(-4,1,10,2); break;
    case 5: line([[-6,-4],[4,0],[-6,4]]); break;
    case 6: ring(-3,0,2); ring(3,0,2); break;
    case 7: c.fillRect(-5,-1,10,2); c.fillRect(-1,-5,2,10); break;
    case 8: line([[-5,-4],[5,0],[-5,4],[-5,-4]]); break;
    case 9: for(let j=0;j<3;j++){ c.rotate(2*Math.PI/3); c.fillRect(1,-1,5,2); } break;
    case 10: c.fillRect(-5,-3,3,6); c.fillRect(0,-2,4,4); break;
    case 11: line([[-7,0],[-4,-3],[3,-3],[6,0],[3,3],[-4,3],[-7,0]]); break;
  }
  c.fillStyle = '#fff'; c.fillRect(0,-1,2,2); c.restore();
}

function drawDetailedWeaponShape(c, wep, ox, oy, scale = 1) {
  c.save();
  c.translate(Math.round(ox), Math.round(oy));
  c.scale(scale, scale);
  if (wep.image?.naturalWidth) {
    const k = Math.min(38 / wep.image.width, 19 / wep.image.height);
    c.imageSmoothingEnabled = false;
    c.drawImage(wep.image, -7, -6, wep.image.width * k, wep.image.height * k);
    c.restore();
    return;
  }

  if (wep.style === 'pistol') {
    c.fillStyle = '#140c07';
    c.fillRect(-6, -1, 6, 8);
    c.fillRect(-5, -5, 19, 7);
    c.fillRect(11, -7, 2, 2);
    c.fillStyle = '#3d2100';
    c.fillRect(-5, 0, 4, 6);
    c.fillStyle = wep.bodyColor;
    c.fillRect(-4, -4, 9, 5);
    c.fillStyle = wep.bulletColor;
    c.fillRect(-1, -3, 4, 3);
    c.fillStyle = wep.barrelColor;
    c.fillRect(5, -4, 8, 4);
    c.fillStyle = '#ffffff';
    c.fillRect(6, -4, 6, 1);
  } else if (wep.style === 'smg') {
    c.fillStyle = '#140c07';
    c.fillRect(-7, -1, 5, 7);
    c.fillRect(2, 0, 4, 9);
    c.fillRect(-8, -6, 25, 8);
    c.fillRect(-4, -8, 10, 2);
    c.fillStyle = '#343a40';
    c.fillRect(-6, 0, 3, 5);
    c.fillRect(3, 1, 2, 7);
    c.fillStyle = wep.bodyColor;
    c.fillRect(-7, -5, 14, 6);
    c.fillStyle = wep.bulletColor;
    c.fillRect(-3, -3, 6, 2);
    c.fillStyle = wep.barrelColor;
    c.fillRect(7, -4, 9, 4);
    c.fillStyle = '#140c07';
    c.fillRect(9, -3, 1, 2);
    c.fillRect(12, -3, 1, 2);
    c.fillStyle = '#ffffff';
    c.fillRect(8, -4, 7, 1);
  } else if (wep.style === 'shotgun') {
    c.fillStyle = '#140c07';
    c.fillRect(-11, -3, 7, 7);
    c.fillRect(-5, -6, 23, 8);
    c.fillRect(14, -7, 4, 10);
    c.fillStyle = '#583101';
    c.fillRect(-10, -2, 5, 5);
    c.fillStyle = wep.bodyColor;
    c.fillRect(-4, -5, 11, 6);
    c.fillStyle = wep.bulletColor;
    c.fillRect(4, 0, 7, 2);
    c.fillStyle = wep.barrelColor;
    c.fillRect(7, -5, 10, 5);
    c.fillRect(15, -6, 2, 8);
    c.fillStyle = '#ffffff';
    c.fillRect(8, -5, 8, 1);
  } else if (wep.style === 'rifle') {
    c.fillStyle = '#140c07';
    c.fillRect(-12, -2, 8, 7);
    c.fillRect(-5, -5, 26, 6);
    c.fillRect(-1, -9, 10, 4);
    c.fillStyle = '#6f4518';
    c.fillRect(-11, -1, 6, 5);
    c.fillStyle = '#adb5bd';
    c.fillRect(0, -8, 8, 2);
    c.fillStyle = wep.bulletColor;
    c.fillRect(7, -8, 1, 2);
    c.fillStyle = wep.bodyColor;
    c.fillRect(-4, -4, 11, 4);
    c.fillStyle = wep.barrelColor;
    c.fillRect(7, -4, 13, 3);
    c.fillStyle = '#ffffff';
    c.fillRect(8, -4, 11, 1);
  } else if (wep.style === 'laser') {
    c.fillStyle = '#140c07';
    c.fillRect(-7, -1, 5, 7);
    c.fillRect(-8, -7, 24, 10);
    c.fillStyle = wep.bodyColor;
    c.fillRect(-7, -6, 12, 8);
    c.fillStyle = wep.barrelColor;
    c.fillRect(5, -6, 10, 8);
    c.fillStyle = wep.bulletColor;
    c.fillRect(6, -4, 2, 4);
    c.fillRect(10, -4, 2, 4);
    c.fillRect(14, -3, 2, 2);
    c.fillStyle = '#ffffff';
    c.fillRect(-5, -5, 8, 1);
  } else {
    c.fillStyle = '#140c07';
    c.fillRect(-8, 0, 5, 7);
    c.fillRect(-9, -8, 26, 12);
    c.fillRect(14, -9, 4, 14);
    c.fillStyle = wep.bodyColor;
    c.fillRect(-8, -7, 13, 10);
    c.fillStyle = '#140c07';
    c.fillRect(-3, -5, 6, 6);
    c.fillStyle = wep.bulletColor;
    c.fillRect(-2, -4, 4, 4);
    c.fillStyle = '#ffffff';
    c.fillRect(-1, -3, 2, 2);
    c.fillStyle = wep.barrelColor;
    c.fillRect(5, -7, 11, 10);
    c.fillRect(15, -8, 2, 12);
    c.fillStyle = '#ffffff';
    c.fillRect(6, -6, 8, 1);
  }

  c.restore();
}

function drawWeaponIcon(c, x, y, w, h, wep) {
  if (wep.image?.naturalWidth) {
    const k = Math.min(w / wep.image.width, h / wep.image.height);
    const iw = wep.image.width * k, ih = wep.image.height * k;
    c.save(); c.imageSmoothingEnabled = false;
    c.drawImage(wep.image, Math.round(x+(w-iw)/2), Math.round(y+(h-ih)/2), iw, ih); c.restore();
    return;
  }
  drawDetailedWeaponShape(c, wep, x + w / 2 - 4, y + h / 2, 1.35);
}

// =========================================================================
// PERSONAGEM 16-BIT + ARMA DETALHADA + BARRA DE RECARGA ANTI-SPAM
// =========================================================================
// =========================================================================
// PIXEL ART MEME SPRITES (estilo Tung Tung Sahur: contorno escuro + luz/sombra)
// =========================================================================
const SKIN_MEMES = [
  ['67','KID'],['Homem-Aranha','SPIDER'],['Doge','DOGE'],['Cheems','DOGE'],
  ['Pepe','PEPE'],['Capivara','CAPI'],['Tralalero Tralala','SHARK'],
  ['Verity','GEN'],['Sigma','GEN'],['Gigachad','GEN'],['Skibidi','GEN'],['Bombardiro','GEN'],
  ['Chaves','GEN'],['Mewing','GEN'],['Rizzler','GEN'],['Ballerina','GEN'],['Pedro Pedro','GEN']
];
const SPR_BASE = { w:'#ffffff', k:'#140c07', r:'#c1121f', p:'#2f3e6b' };
const SPR = {
  TUNG: { p:{ n:'#d9923f', d:'#9a5a24', h:'#f0b963', r:'#5a1a10' }, r:[
    '.....nnnnnn.....','....nnnnnnnn....','....nwwnnwwn....','....nwknnwkn....','....nnnnnnnn....',
    '....nndrrdnn....','....nnnnnnnn....','.....nnnnnn.....','....nnnnnnnn....','.h..nnnnnnnn....',
    '.hh.nnndnnnn.n..','..hhnnnnnnnn.n..','...hnnnndnnn.n..','....nnnnnnnn....','....nnnnnnnn....',
    '.....nn..nn.....','.....nn..nn.....','.....nn..nn.....','....nnn..nnn....'] },
  KID: { p:{ h:'#3b2314' }, r:[
    '.....hhhhhh.....','....hhhhhhhh....','....hssssssh....','.s..ssksskss..s.','.s..ssssssss..s.',
    '.s..sssrrsss..s.','.ss..ssssss..ss.','..s.cccccccc.s..','...cccaaccccc...','....cccaacc.....',
    '....cccccccc....','....pppppppp....','....ppp..ppp....','....ppp..ppp....','....ppp..ppp....',
    '...wwww..wwww...'] },
  SPIDER: { p:{ c:'#d62828', l:'#1d4e9e' }, r:[
    '.....cccccc.....','....cccccccc....','....cwwccwwc....','....cwwccwwc....','....cccccccc....',
    '.....cccccc.....','...cccccccccc...','..ccccckkccccc..','..ccccckkccccc..','..c.llllllll.c..',
    '..c.llllllll.c..','....llllllll....','....lll..lll....','....lll..lll....','....lll..lll....',
    '....ccc..ccc....'] },
  DOGE: { p:{ y:'#e8a94d', w:'#fff3d6', r:'#ff6b81' }, r:[
    '....yy....yy....','....yyy..yyy....','....yyyyyyyy....','...yyyyyyyyyy...','...yykyyyykyy...',
    '...yywwwwwwyy...','....wwwkkwww....','....wwwwrwww....','.....yyyyyy.....','....ccyyyycc....',
    '...yccccccccy...','...y.cccccc.y...','....cccaaccc....','.....yyyyyy.....','.....yy..yy.....',
    '.....yy..yy.....','.....yy..yy.....','....www..www....'] },
  PEPE: { p:{ g:'#5fa84a', d:'#3d7a32', r:'#b5384a' }, r:[
    '...gggg..gggg...','..gwwwwggwwwwg..','..gwwkwggwkwwg..','..gggggggggggg..','..gggggggggggg..',
    '...gddddddddg...','....rrrrrrrr....','....gggggggg....','.....gggggg.....','....ccgggcc.....',
    '...gccccccccg...','...g.cccccc.g...','....cccaaccc....','....cccccccc....','.....gg..gg.....',
    '.....gg..gg.....','.....gg..gg.....','....ggg..ggg....'] },
  CAPI: { p:{ y:'#a9743b', n:'#5a3a1c' }, r:[
    '....yy....yy....','...yyyyyyyyyy...','...yyyyyyyyyy...','...yykyyyykyy...','...yyyyyyyyyy...',
    '...yyyynnyyyy...','...yynnnnnnyy...','....yyyyyyyy....','...yyyyyyyyyy...','..yyyyyyyyyyyy..',
    '..yyyyyyyyyyyy..','..yyyyaayyyyyy..','..yyyyyyyyyyyy..','...yyyyyyyyyy...','....yy....yy....',
    '....yy....yy....','...nnn....nnn...'] },
  SHARK: { p:{ l:'#6d8fb3', w:'#e8f1f8' }, r:[
    '.......ll.......','......llll......','.....llllll.....','....llllllll....','...lllllllkllll.',
    '..llllllllllllll','..llllllllllllll','...wlwlwlwlwlw..','....wwwwwwwwww..','....wwwwwwwwww..',
    '.....wwwwwwww...','......wwwwww....','......ll..ll....','......ll..ll....','......ll..ll....',
    '.....aaa..aaa...'] },
  GEN: { p:{}, r:[
    '.....hhhhhh.....','....hhhhhhhh....','....hssssssh....','....ssksskss....','....ssssssss....',
    '....sssrrsss....','.....ssssss.....','...cccccccccc...','..sccccaaccccs..','..scccaaaacccs..',
    '..s.cccccccc.s..','....pppppppp....','....ppp..ppp....','....ppp..ppp....','....ppp..ppp....',
    '...kkkk..kkkk...'] }
};
for (const k in SPR) { SPR[k].pal = Object.assign({}, SPR_BASE, SPR[k].p); SPR[k].r = SPR[k].r.map(s => (s + '................').slice(0, 16)); }
const HAIRS = ['#2b1a0e', '#e5c07b', '#c1440e', '#222222', '#7209b7', '#00b4d8'];
const _tungImg = new Image();
_tungImg.src = 'assets/jogo/_tungImg.png';

const CUSTOM_SPRITE_URIS = {
EVENT0:"assets/jogo/EVENT0.png",
EVENT1:"assets/jogo/EVENT1.png",
EVENT2:"assets/jogo/EVENT2.png",
EVENT3:"assets/jogo/EVENT3.png",
EVENT4:"assets/jogo/EVENT4.png",
EVENT5:"assets/jogo/EVENT5.png",
EVENT6:"assets/jogo/EVENT6.png",
EVENT7:"assets/jogo/EVENT7.png",
EVENT8:"assets/jogo/EVENT8.png",
EVENT9:"assets/jogo/EVENT9.png",
EVENT10:"assets/jogo/EVENT10.png",
EVENT11:"assets/jogo/EVENT11.png",
EVENT12:"assets/jogo/EVENT12.png",
  GOKU: 'assets/jogo/GOKU.png',
  SONIC: 'assets/jogo/SONIC.png',
  NARUTO: 'assets/jogo/NARUTO.png',
  GOJO: 'assets/jogo/GOJO.png',
  LUFFY: 'assets/jogo/LUFFY.png'
};
const _customImgs = {};
for (const k in CUSTOM_SPRITE_URIS) {
  const im = new Image();
  im.src = CUSTOM_SPRITE_URIS[k];
  _customImgs[k] = im;
}
const _sprCache = {};

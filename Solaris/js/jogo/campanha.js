const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

const C_SOLAR_PANEL = '#382215';
const C_SOLAR_ACCENT = '#ffd166';

const TOTAL_LEVELS = 10000;
const collectionSkins = ["Zenitsu Agatsuma", "Tanjiro Kamado", "Giyu Tomioka", "Squirtle", "Pikachu", "Charmander", "Megumi Fushiguro", "Ryomen Sukuna", "Toji Fushiguro", "Superman", "Homem-Aranha", "Capitão América", "Homem de Ferro"];
const pokemonPetIds = new Map([[10003, 8], [10004, 9], [10005, 10]]);

let screen = 'title';
let shopTab = 'weapons';
let currentLevel = 0;



function safeJSON(k, d) { try { const v = JSON.parse(gameSave.getItem(k)); return (v === null || v === undefined) ? d : v; } catch (e) { return d; } }
function safeInt(k, d) { const v = parseInt(gameSave.getItem(k)); return Number.isFinite(v) ? v : d; }
let paused = false, levelTime = 0, bestTime = 0;

let unlockedLevel = safeInt('solaris_v5_unlocked', 0);
let deaths = safeInt('solaris_v5_deaths', 0);
let sunflowers = safeInt('solaris_v5_coins', 0);
let openedChests = safeJSON('solaris_v5_chests', []);


let ownedWeapons = safeJSON('solaris_v5_weapons', [0]);
let equippedWeaponId = safeInt('solaris_v5_weapon', 0);

let ownedPets = safeJSON('solaris_v5_pets', []);
let equippedPetId = safeInt('solaris_v5_pet', -1);

// Até esta versão, os itens da coleção eram concedidos automaticamente.
if (gameSave.getItem('solaris_v5_collection_loot') !== '1') {
  ownedWeapons = ownedWeapons.filter(id => id < 24);
  ownedPets = ownedPets.filter(id => id < 8);
  if (!ownedWeapons.includes(equippedWeaponId)) equippedWeaponId = 0;
  if (!ownedPets.includes(equippedPetId)) equippedPetId = -1;
}
let mapPage = Math.floor(unlockedLevel / 20);
let wepPage = 0;
let soundEnabled = true;

let deadTimer = 0;
let diedToBoss = false;
let enterDoorTimer = 0;
let spawnAnimTimer = 0;
let shakeTimer = 0;
let bossBannerTimer = 0;
let knockoutTimer = 0;

let particles = [];
let floatingTexts = [];
let shockwaves = [];
let playerBullets = [];
let petBullets = [];
let shootCooldown = 0;
let weaponRecoil = 0;
let muzzleFlashTimer = 0;

const mouse = { x: 560, y: 150, down: false, active: false };

// =========================================================================
// BIOMAS 16-BIT PROFISSIONAIS
// =========================================================================
const BIOMES = [
  {
    name: 'FLORESTA TERRARIA',
    skyBands: ['#2b59c3', '#4379f2', '#6499ff', '#8ab4ff', '#b5d1ff'],
    mtnFar: '#36588c', mtnNear: '#275c43',
    horizonGround: '#1b4332',
    dirtBase: '#6f4518', dirtMid: '#583101', dirtDark: '#3d2100', dirtLight: '#8b5e34', oreColor: '#adb5bd',
    grassTop: '#80ed99', grassMid: '#38b000', grassDark: '#007200',
    leafDark: '#004b23', leafMid: '#2b9348', leafLight: '#70e000'
  },
  {
    name: 'CARMIM SANGRENTO',
    skyBands: ['#2b0512', '#4a0a1f', '#730d2b', '#991136', '#bf1745'],
    mtnFar: '#450719', mtnNear: '#2e0310',
    horizonGround: '#24020c',
    dirtBase: '#4a2525', dirtMid: '#331616', dirtDark: '#210c0c', dirtLight: '#693636', oreColor: '#ff4d6d',
    grassTop: '#ff758f', grassMid: '#d00000', grassDark: '#800f2f',
    leafDark: '#6a040f', leafMid: '#9d0208', leafLight: '#e85d04'
  },
  {
    name: 'CONSAGRADO (HALLOW)',
    skyBands: ['#1d0038', '#33085c', '#4f1487', '#6f24b5', '#913ee0'],
    mtnFar: '#33085c', mtnNear: '#1d0038',
    horizonGround: '#140029',
    dirtBase: '#3d345b', dirtMid: '#28223d', dirtDark: '#191526', dirtLight: '#574b82', oreColor: '#ffd166',
    grassTop: '#80ffdb', grassMid: '#00bbf9', grassDark: '#0077b6',
    leafDark: '#0077b6', leafMid: '#00bbf9', leafLight: '#90e0ef'
  },
  {
    name: 'BIOMA DA NEVE',
    skyBands: ['#006494', '#0081a7', '#2ec4b6', '#83c5be', '#cbf3f0'],
    mtnFar: '#3d6b8a', mtnNear: '#192e4d',
    horizonGround: '#13243d',
    dirtBase: '#4a5759', dirtMid: '#333d3f', dirtDark: '#1f2627', dirtLight: '#6b705c', oreColor: '#4cc9f0',
    grassTop: '#ffffff', grassMid: '#caf0f8', grassDark: '#90e0ef',
    leafDark: '#1b4332', leafMid: '#2d6a4f', leafLight: '#b7e4c7'
  },
  {
    name: 'CORRUPÇÃO ROXA',
    skyBands: ['#070010', '#12002b', '#220042', '#380866', '#531391'],
    mtnFar: '#220042', mtnNear: '#140624',
    horizonGround: '#0e041a',
    dirtBase: '#362c42', dirtMid: '#231c2b', dirtDark: '#14101a', dirtLight: '#4e4061', oreColor: '#c77dff',
    grassTop: '#e0aaff', grassMid: '#9d4edd', grassDark: '#5a189a',
    leafDark: '#3c096c', leafMid: '#7b2cbf', leafLight: '#c77dff'
  }
];

function getBiomeForLevel(lvlIdx) {
  const bossChapter = Math.floor(lvlIdx / 20);
  return BIOMES[bossChapter % BIOMES.length];
}

const bgCache = document.createElement('canvas');
bgCache.width = 800;
bgCache.height = 450;
const bgCtx = bgCache.getContext('2d', { alpha: false });
bgCtx.imageSmoothingEnabled = false;
let cachedBgKey = '';

function drawTerrariaTree(c, x, groundY, trunkH, b) {
  const P = 2;
  c.fillStyle = '#1b1109';
  c.fillRect(x - 8, groundY - trunkH, 16, trunkH + 40);
  c.fillStyle = '#583101';
  c.fillRect(x - 6, groundY - trunkH, 12, trunkH + 40);
  c.fillStyle = '#7f4f24';
  c.fillRect(x - 4, groundY - trunkH, 4, trunkH + 40);
  c.fillStyle = '#3d2100';
  for (let ty = groundY - trunkH + 4; ty < groundY + 12; ty += 8) {
    c.fillRect(x + 1, ty, 3, 4);
    c.fillRect(x - 5, ty + 3, 2, 3);
  }
  c.fillStyle = '#1b1109';
  c.fillRect(x - 16, groundY - 6, 32, 10);
  c.fillStyle = '#583101';
  c.fillRect(x - 14, groundY - 4, 28, 8);
  c.fillStyle = '#7f4f24';
  c.fillRect(x - 11, groundY - 3, 10, 4);

  const cy = groundY - trunkH - 18;
  const puffs = [
    { dx: 0, dy: -16, r: 22 },
    { dx: -18, dy: -2, r: 18 },
    { dx: 18, dy: -2, r: 18 },
    { dx: -12, dy: -14, r: 16 },
    { dx: 12, dy: -14, r: 16 }
  ];

  c.fillStyle = '#0d1b0e';
  for (let p of puffs) {
    for (let yy = -p.r - P; yy <= p.r + P; yy += P) {
      for (let xx = -p.r - P; xx <= p.r + P; xx += P) {
        if (xx * xx + yy * yy <= (p.r + P) * (p.r + P)) {
          c.fillRect(x + p.dx + xx, cy + p.dy + yy, P, P);
        }
      }
    }
  }
  c.fillStyle = b.leafDark;
  for (let p of puffs) {
    for (let yy = -p.r; yy <= p.r; yy += P) {
      for (let xx = -p.r; xx <= p.r; xx += P) {
        if (xx * xx + yy * yy <= p.r * p.r) {
          c.fillRect(x + p.dx + xx, cy + p.dy + yy, P, P);
        }
      }
    }
  }
  c.fillStyle = b.leafMid;
  for (let p of puffs) {
    for (let yy = -p.r; yy <= p.r - 4; yy += P) {
      for (let xx = -p.r + 2; xx <= p.r - 2; xx += P) {
        if (xx * xx + yy * yy <= (p.r - 2) * (p.r - 2)) {
          c.fillRect(x + p.dx + xx, cy + p.dy + yy, P, P);
        }
      }
    }
  }
  c.fillStyle = b.leafLight;
  for (let p of puffs) {
    for (let yy = -p.r + 2; yy <= -2; yy += P) {
      for (let xx = -p.r + 4; xx <= 4; xx += P) {
        if (xx * xx + yy * yy <= (p.r - 5) * (p.r - 5)) {
          c.fillRect(x + p.dx + xx, cy + p.dy + yy, P, P);
        }
      }
    }
  }
}

function drawPixelCloud(c, x, y, s = 2) {
  const shape = [
    '00001111110000',
    '00111111111100',
    '01111111111110',
    '11111111111111',
    '11111111111111',
    '02222222222220'
  ];
  for (let r = 0; r < shape.length; r++) {
    for (let col = 0; col < shape[r].length; col++) {
      const ch = shape[r][col];
      if (ch === '0') continue;
      c.fillStyle = ch === '1' ? '#ffffff' : '#cbd5e1';
      c.fillRect(x + col * s * 2, y + r * s * 2, s * 2, s * 2);
    }
  }
}

function renderBackgroundCache(biome, isBoss, bossType = 'default') {
  const key = `${biome.name}_${isBoss}_${bossType}`;
  if (cachedBgKey === key) return;
  cachedBgKey = key;

  const bossBands = bossType === 'mogger'
    ? ['#121417', '#1e2229', '#2b303a', '#3b4252', '#4c566a']
    : ['#140004', '#240008', '#3b030d', '#590614', '#730719'];
  const bands = isBoss ? bossBands : biome.skyBands;
  for (let i = 0; i < 5; i++) {
    bgCtx.fillStyle = bands[i];
    bgCtx.fillRect(0, i * 90, 800, 90);
  }

  bgCtx.fillStyle = isBoss ? (bossType === 'mogger' ? 'rgba(255,255,255,0.2)' : 'rgba(230,57,70,0.22)') : 'rgba(255,209,102,0.25)';
  bgCtx.fillRect(658, 24, 64, 64);
  bgCtx.fillStyle = isBoss ? (bossType === 'mogger' ? '#adb5bd' : '#e63946') : '#ff9e00';
  bgCtx.fillRect(666, 32, 48, 48);
  bgCtx.fillStyle = isBoss ? (bossType === 'mogger' ? '#e9ecef' : '#ffba08') : '#ffd166';
  bgCtx.fillRect(670, 36, 40, 40);
  bgCtx.fillStyle = '#ffffff';
  bgCtx.fillRect(676, 42, 28, 28);

  drawPixelCloud(bgCtx, 65, 42, 2);
  drawPixelCloud(bgCtx, 310, 28, 3);
  drawPixelCloud(bgCtx, 515, 58, 2);

  bgCtx.fillStyle = isBoss ? (bossType === 'mogger' ? '#1b1f26' : '#240008') : biome.mtnFar;
  for (let x = 0; x < 800; x += 8) {
    const mh = Math.floor((Math.sin(x * 0.015) * 0.5 + 0.5) * 65 + (Math.cos(x * 0.04) * 18));
    bgCtx.fillRect(x, 225 - mh, 8, mh + 225);
  }

  const horizonY = 296;
  bgCtx.fillStyle = isBoss ? (bossType === 'mogger' ? '#14171c' : '#1c0006') : biome.mtnNear;
  for (let x = 0; x < 800; x += 8) {
    const mh = Math.floor((Math.cos(x * 0.022) * 0.5 + 0.5) * 38 + 20);
    bgCtx.fillRect(x, horizonY - mh, 8, mh + 160);
  }
  bgCtx.fillStyle = isBoss ? (bossType === 'mogger' ? '#0d0f12' : '#120004') : biome.horizonGround;
  bgCtx.fillRect(0, horizonY - 4, 800, 160);

  drawTerrariaTree(bgCtx, 95, horizonY, 54, biome);
  drawTerrariaTree(bgCtx, 235, horizonY, 44, biome);
  drawTerrariaTree(bgCtx, 535, horizonY, 60, biome);
  drawTerrariaTree(bgCtx, 710, horizonY, 48, biome);
}

function drawSkyCameo(biome, isBoss) {
  const t = Date.now() * 0.04;
  const cameos = ['tails', 'samus_ship', 'kirby_star', 'terraria_eye'];
  const type = isBoss ? 'terraria_eye' : cameos[Math.floor(currentLevel / 3) % cameos.length];
  const x = Math.round(((t * 1.1) % 940) - 70);
  const y = Math.round(76 + Math.sin(t * 0.08) * 12);

  ctx.save();
  ctx.translate(x, y);

  if (type === 'tails') {
    const tailSpin = Math.floor(Date.now() / 55) % 2 === 0;
    ctx.fillStyle = '#ff9e00';
    if (tailSpin) {
      ctx.fillRect(-16, -8, 10, 4);
      ctx.fillRect(-16, 2, 10, 4);
    } else {
      ctx.fillRect(-14, -4, 10, 6);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-16, tailSpin ? -8 : -4, 3, 3);
    ctx.fillStyle = '#ff9e00';
    ctx.fillRect(-6, -3, 12, 8);
    ctx.fillRect(2, -9, 10, 9);
    ctx.fillRect(3, -13, 3, 4);
    ctx.fillRect(8, -13, 3, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, -4, 6, 4);
    ctx.fillStyle = '#00bbf9';
    ctx.fillRect(8, -7, 2, 3);
  } else if (type === 'samus_ship') {
    ctx.fillStyle = '#e63946';
    ctx.fillRect(-14, -2, 28, 6);
    ctx.fillStyle = '#ff9e00';
    ctx.fillRect(-10, -5, 20, 4);
    ctx.fillStyle = '#70e000';
    ctx.fillRect(-4, -6, 8, 3);
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(-18, 0, 4, 2);
  } else if (type === 'kirby_star') {
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-10, 2, 20, 4);
    ctx.fillRect(-6, -1, 12, 8);
    ctx.fillStyle = '#ff758f';
    ctx.fillRect(-5, -8, 10, 9);
    ctx.fillStyle = '#140c07';
    ctx.fillRect(1, -6, 2, 3);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -6, 14, 12);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(-13, -4, 5, 2);
    ctx.fillRect(-13, 2, 5, 2);
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(2, -3, 4, 6);
  }

  ctx.restore();
}



function getDiffConfig() {
  return DIFFICULTIES.find(d => d.id === currentDifficulty) || DIFFICULTIES[1];
}

// =========================================================================
// 24 ARMAS COM SILHUETAS E MECÂNICAS DISTINTAS
// =========================================================================
const WEAPONS = [
  { id: 0, name: 'Chinelo do Chaves', rarity: 'COMUM', rarityColor: '#adb5bd', bodyColor: '#7f4f24', barrelColor: '#e07a5f', bulletColor: '#ffd166', damage: 5.0, cooldown: 20, speed: 6.8, spread: 1, style: 'pistol', mechDesc: 'Tiro único preciso' },
  { id: 1, name: 'Pix Pistol', rarity: 'COMUM', rarityColor: '#adb5bd', bodyColor: '#5c3a21', barrelColor: '#ffd166', bulletColor: '#ffd166', damage: 6.2, cooldown: 22, speed: 7.2, spread: 1, style: 'pistol', mechDesc: 'Tambor giratório forte' },
  { id: 2, name: 'Bat do Tung Tung', rarity: 'COMUM', rarityColor: '#adb5bd', bodyColor: '#1d3557', barrelColor: '#4cc9f0', bulletColor: '#4cc9f0', damage: 5.8, cooldown: 18, speed: 7.5, spread: 1, style: 'laser', mechDesc: 'Canhão de braço plasma' },
  { id: 3, name: 'Mamadeira Sigma', rarity: 'COMUM', rarityColor: '#adb5bd', bodyColor: '#7f4f24', barrelColor: '#adb5bd', bulletColor: '#ff9e00', damage: 7.5, cooldown: 25, speed: 7.0, spread: 1, style: 'rifle', mechDesc: 'Rifle longo de precisão' },
  { id: 4, name: 'Zap do Tio', rarity: 'COMUM', rarityColor: '#adb5bd', bodyColor: '#e63946', barrelColor: '#ff7b00', bulletColor: '#ff7b00', damage: 4.8, cooldown: 15, speed: 7.2, spread: 1, style: 'smg', mechDesc: 'Rajada de bolas de fogo' },
  { id: 5, name: 'Buzina do Ohio', rarity: 'COMUM', rarityColor: '#adb5bd', bodyColor: '#2d6a4f', barrelColor: '#80ed99', bulletColor: '#80ed99', damage: 6.0, cooldown: 18, speed: 7.0, spread: 1, style: 'rifle', mechDesc: 'Nozes de precisão' },

  { id: 6, name: 'Tubarão Tralalero', rarity: 'RARA', rarityColor: '#4cc9f0', bodyColor: '#3d2a22', barrelColor: '#ffd166', bulletColor: '#ffd166', damage: 4.6, cooldown: 11, speed: 7.8, spread: 1, style: 'smg', mechDesc: 'Metralhadora rápida' },
  { id: 7, name: 'Skibidi Blaster', rarity: 'RARA', rarityColor: '#4cc9f0', bodyColor: '#005f73', barrelColor: '#90e0ef', bulletColor: '#90e0ef', damage: 8.5, cooldown: 20, speed: 7.6, spread: 1, style: 'laser', mechDesc: 'Raio criogênico veloz' },
  { id: 8, name: 'Escopeta Gigachad', rarity: 'RARA', rarityColor: '#4cc9f0', bodyColor: '#6a040f', barrelColor: '#ffa200', bulletColor: '#ff9e00', damage: 4.5, cooldown: 26, speed: 7.0, spread: 3, style: 'shotgun', mechDesc: 'Cano duplo 3 projéteis' },
  { id: 9, name: 'Rifle Rizzler', rarity: 'RARA', rarityColor: '#4cc9f0', bodyColor: '#240046', barrelColor: '#00f5d4', bulletColor: '#00f5d4', damage: 5.2, cooldown: 12, speed: 8.0, spread: 1, style: 'smg', mechDesc: 'Rajada de energia' },
  { id: 10, name: 'Canhão Brainrot', rarity: 'RARA', rarityColor: '#4cc9f0', bodyColor: '#9b2226', barrelColor: '#ff758f', bulletColor: '#ff4d6d', damage: 11.0, cooldown: 26, speed: 7.2, spread: 1, style: 'cannon', mechDesc: 'Explosão de impacto' },
  { id: 11, name: 'Lança-Pastel', rarity: 'RARA', rarityColor: '#4cc9f0', bodyColor: '#e5e5e5', barrelColor: '#4cc9f0', bulletColor: '#ff9e00', damage: 7.4, cooldown: 17, speed: 8.2, spread: 1, style: 'laser', mechDesc: 'Orbe quântico veloz' },

  { id: 12, name: 'Revólver Aura', rarity: 'ÉPICA', rarityColor: '#c77dff', bodyColor: '#3c096c', barrelColor: '#c77dff', bulletColor: '#e0aaff', damage: 5.5, cooldown: 22, speed: 7.4, spread: 3, style: 'shotgun', mechDesc: '3 ondas arcanas' },
  { id: 13, name: 'Bazuca da Resenha', rarity: 'ÉPICA', rarityColor: '#c77dff', bodyColor: '#370617', barrelColor: '#ff5400', bulletColor: '#ff5400', damage: 6.2, cooldown: 12, speed: 8.2, spread: 1, style: 'smg', mechDesc: 'Fogo contínuo' },
  { id: 14, name: 'Estilingue Pedro Pedro', rarity: 'ÉPICA', rarityColor: '#c77dff', bodyColor: '#1b4332', barrelColor: '#52b788', bulletColor: '#74c69d', damage: 9.8, cooldown: 18, speed: 8.5, spread: 1, style: 'rifle', mechDesc: 'Tiro teleguiado' },
  { id: 15, name: 'Pente Mewing', rarity: 'ÉPICA', rarityColor: '#c77dff', bodyColor: '#023e8a', barrelColor: '#00b4d8', bulletColor: '#00f5d4', damage: 6.5, cooldown: 10, speed: 8.6, spread: 1, style: 'smg', mechDesc: 'Cadência altíssima' },
  { id: 16, name: 'Laser do Doge', rarity: 'ÉPICA', rarityColor: '#c77dff', bodyColor: '#9d0208', barrelColor: '#faa307', bulletColor: '#ffba08', damage: 5.2, cooldown: 19, speed: 7.2, spread: 3, style: 'shotgun', mechDesc: 'Sopro triplo de fogo' },

  { id: 17, name: 'Lança-Capivara', rarity: 'LENDÁRIA', rarityColor: '#ffd166', bodyColor: '#3d2a22', barrelColor: '#ffd166', bulletColor: '#ffd166', damage: 16.0, cooldown: 22, speed: 8.8, spread: 1, style: 'cannon', mechDesc: 'Estrela explosiva' },
  { id: 18, name: 'Churrasqueira Plasma', rarity: 'LENDÁRIA', rarityColor: '#ffd166', bodyColor: '#240046', barrelColor: '#ffd166', bulletColor: '#00f5d4', damage: 5.8, cooldown: 20, speed: 8.0, spread: 4, style: 'shotgun', mechDesc: 'Leque quádruplo' },
  { id: 19, name: 'Metralha Fanum Tax', rarity: 'LENDÁRIA', rarityColor: '#ffd166', bodyColor: '#005f73', barrelColor: '#00f5d4', bulletColor: '#00f5d4', damage: 7.4, cooldown: 10, speed: 9.2, spread: 1, style: 'smg', mechDesc: 'Tempestade plasma' },
  { id: 20, name: 'Canhão Nyan', rarity: 'LENDÁRIA', rarityColor: '#ffd166', bodyColor: '#10002b', barrelColor: '#ffd166', bulletColor: '#ffffff', damage: 18.0, cooldown: 20, speed: 9.8, spread: 1, style: 'laser', mechDesc: 'Flecha de luz pura' },

  { id: 21, name: 'Railgun Mogger', rarity: 'MÍTICA', rarityColor: '#ff007f', bodyColor: '#161a1d', barrelColor: '#ff007f', bulletColor: '#ff007f', damage: 8.5, cooldown: 11, speed: 9.4, spread: 3, style: 'shotgun', mechDesc: 'Rajada tripla mítica' },
  { id: 22, name: 'Bombardiro Cannon', rarity: 'MÍTICA', rarityColor: '#ff007f', bodyColor: '#3d2a22', barrelColor: '#ffd166', bulletColor: '#ffd166', damage: 22.0, cooldown: 17, speed: 10.0, spread: 1, style: 'cannon', mechDesc: 'Explosão solar' },
  { id: 23, name: 'Arma Suprema 67', rarity: 'MÍTICA', rarityColor: '#ff007f', bodyColor: '#240046', barrelColor: '#00f5d4', bulletColor: '#70e000', damage: 10.5, cooldown: 15, speed: 9.2, spread: 3, style: 'cannon', mechDesc: 'Esferas explosivas' }
];

const collectionGunImages = ["assets/armas/arma-001.png", "assets/armas/arma-002.png", "assets/armas/arma-003.png", "assets/armas/arma-004.png", "assets/armas/arma-005.png", "assets/armas/arma-006.png", "assets/armas/arma-007.png", "assets/armas/arma-008.png", "assets/armas/arma-009.png", "assets/armas/arma-010.png", "assets/armas/arma-011.png", "assets/armas/arma-012.png", "assets/armas/arma-013.png", "assets/armas/arma-014.png", "assets/armas/arma-015.png", "assets/armas/arma-016.png", "assets/armas/arma-017.png", "assets/armas/arma-018.png", "assets/armas/arma-019.png", "assets/armas/arma-020.png", "assets/armas/arma-021.png", "assets/armas/arma-022.png", "assets/armas/arma-023.png", "assets/armas/arma-024.png", "assets/armas/arma-025.png", "assets/armas/arma-026.png", "assets/armas/arma-027.png", "assets/armas/arma-028.png", "assets/armas/arma-029.png", "assets/armas/arma-030.png", "assets/armas/arma-031.png", "assets/armas/arma-032.png", "assets/armas/arma-033.png", "assets/armas/arma-034.png", "assets/armas/arma-035.png", "assets/armas/arma-036.png", "assets/armas/arma-037.png", "assets/armas/arma-038.png", "assets/armas/arma-039.png", "assets/armas/arma-040.png", "assets/armas/arma-041.png", "assets/armas/arma-042.png", "assets/armas/arma-043.png", "assets/armas/arma-044.png", "assets/armas/arma-045.png", "assets/armas/arma-046.png", "assets/armas/arma-047.png", "assets/armas/arma-048.png", "assets/armas/arma-049.png", "assets/armas/arma-050.png", "assets/armas/arma-051.png", "assets/armas/arma-052.png", "assets/armas/arma-053.png", "assets/armas/arma-054.png", "assets/armas/arma-055.png", "assets/armas/arma-056.png", "assets/armas/arma-057.png", "assets/armas/arma-058.png", "assets/armas/arma-059.png", "assets/armas/arma-060.png", "assets/armas/arma-061.png", "assets/armas/arma-062.png", "assets/armas/arma-063.png", "assets/armas/arma-064.png", "assets/armas/arma-065.png", "assets/armas/arma-066.png", "assets/armas/arma-067.png", "assets/armas/arma-068.png", "assets/armas/arma-069.png", "assets/armas/arma-070.png", "assets/armas/arma-071.png", "assets/armas/arma-072.png", "assets/armas/arma-073.png", "assets/armas/arma-074.png", "assets/armas/arma-075.png", "assets/armas/arma-076.png", "assets/armas/arma-077.png", "assets/armas/arma-078.png", "assets/armas/arma-079.png", "assets/armas/arma-080.png", "assets/armas/arma-081.png", "assets/armas/arma-082.png", "assets/armas/arma-083.png", "assets/armas/arma-084.png", "assets/armas/arma-085.png", "assets/armas/arma-086.png", "assets/armas/arma-087.png", "assets/armas/arma-088.png", "assets/armas/arma-089.png", "assets/armas/arma-090.png", "assets/armas/arma-091.png", "assets/armas/arma-092.png", "assets/armas/arma-093.png", "assets/armas/arma-094.png", "assets/armas/arma-095.png", "assets/armas/arma-096.png", "assets/armas/arma-097.png", "assets/armas/arma-098.png", "assets/armas/arma-099.png", "assets/armas/arma-100.png", "assets/armas/arma-101.png", "assets/armas/arma-102.png", "assets/armas/arma-103.png", "assets/armas/arma-104.png", "assets/armas/arma-105.png"].map(src => {
  const image = new Image();
  image.src = src;
  return image;
});
const collectionNames = ["Colmeia de Ferro", "Grilo de Cobre", "Carapaça", "Trovão de Bolso", "Maré Azul", "Órbita Fria", "Ferrovia", "Vespa Ácida", "Velho Rubi", "Horizonte Longo", "Fita Neon", "Arara Vermelha", "Brasa Dupla", "Olho da Serra", "Lua Vazada", "Areia Fina", "Cascavel", "Cão de Guarda", "Arpão Boreal", "Gavião Cinza", "Prego Verde", "Coroa de Cinzas", "Leão Carmim", "Cigarra", "Loba de Prata", "Amuleto Rosa", "Morcego de Brasa", "Bolha Cobalto", "Ferradura", "Pedra Lunar", "Espinha de Aço", "Sombra Curta", "Tambor Noturno", "Porcelana", "Mel de Ferro", "Bloco de Chumbo", "Telescópio", "Punho de Granito", "Peixe-Espada", "Lince do Deserto", "Vigia", "Bico de Ouro", "Linha do Norte", "Coruja", "Junco Negro", "Rosa Imperial", "Engrenagem", "Cedro", "Pérola Orbital", "Abelha Solar", "Trilho de Nogueira", "Sopro de Gelo", "Lanterna do Brejo", "Mapa do Tesouro", "Besouro Verde", "Dália Negra", "Via Láctea", "Faísca de Ouro", "Cambalhota", "Casulo", "Farol Branco", "Coração de Bronze", "Jacaré", "Mariposa", "Girassol", "Trinca", "Torre de Vigia", "Saca-Rolhas", "Ponte de Ferro", "Pimenta", "Pixel Violeta", "Cometa Rubro", "Aquário", "Garça", "Caldeira", "Marreta", "Tempestade Branca", "Escaravelho", "Asa de Titânio", "Fóssil", "Ametista", "Aurora", "Carvalho", "Gêmeas de Cobre", "Névoa", "Andorinha", "Centauro", "Urso Polar", "Fornalha", "Canela", "Mandíbula", "Gralha", "Barracuda", "Âmbar", "Vórtice", "Prisma", "Monólito", "Fagulha Azul", "Pirilampo", "Sabiá", "Quimera", "Louva-a-Deus", "Eclipse", "Chuva de Prata", "Raposa do Sol"];
const originalWeapons = WEAPONS.slice();
originalWeapons.forEach((weapon, i) => { weapon.image = collectionGunImages[i]; });
collectionGunImages.forEach((image, i) => {
  const base = originalWeapons[i % originalWeapons.length];
  const id = WEAPONS.length;
  WEAPONS.push({ ...base, id, baseId: base.id, image, name: collectionNames[i] });

});
// Conserva a ordem relativa de força e velocidade dos modelos de origem.
const byDamage = WEAPONS.slice().sort((a,b) => a.damage - b.damage || a.id - b.id);
const byRate = WEAPONS.slice().sort((a,b) => b.cooldown - a.cooldown || a.id - b.id);
byDamage.forEach((weapon, rank) => {
  const base = (30 + rank) / 10;
  // Meio décimo distingue o dano mítico dos valores das demais raridades.
  weapon.damage = weapon.rarity === 'MÍTICA' ? (Math.floor(base * 11.5) + 0.5) / 10 : base;
});
byRate.forEach((weapon, rank) => {
  weapon.shotsPerSecond = (220 + rank * 4) / 100;
  weapon.cooldown = 60 / weapon.shotsPerSecond;
});

// Bazuca inspirada na imagem enviada: muito dano, mas recarga lenta.
const bazucaEsmeraldaImage = new Image();
bazucaEsmeraldaImage.src = 'assets/jogo/bazucaEsmeraldaImage.png';
const bazucaEsmeralda = {
  id: WEAPONS.length,
  name: 'Bazuca Esmeralda',
  rarity: 'MÍTICA',
  rarityColor: '#ff007f',
  bodyColor: '#355e4b',
  barrelColor: '#80ed99',
  bulletColor: '#70e000',
  damage: 50,
  cooldown: 100,
  shotsPerSecond: 0.60,
  speed: 7.2,
  spread: 1,
  style: 'cannon',
  mechDesc: 'Foguete devastador; recarga lenta',
  image: bazucaEsmeraldaImage
};
WEAPONS.push(bazucaEsmeralda);
function getWeaponById(id) { return WEAPONS[id] || WEAPONS[0]; }
function getActiveWeapon() { return getWeaponById(equippedWeaponId); }

// =========================================================================
// 8 PETS DE APOIO & OVOS
// =========================================================================
const PETS = [
  { id: 0, name: 'Capivara Ok-Ok-Ok', rarity: 'COMUM', rarityColor: '#adb5bd', bodyColor: '#00bbf9', eyeColor: '#140c07', accent: '#90e0ef', bulletColor: '#00bbf9', damage: 1.5, cooldown: 68, speed: 5.5, style: 'slime', desc: 'Calma e atira pedrinhas' },
  { id: 1, name: 'Doge Wow', rarity: 'COMUM', rarityColor: '#adb5bd', bodyColor: '#80ffdb', eyeColor: '#ffffff', accent: '#4cc9f0', bulletColor: '#80ffdb', damage: 1.8, cooldown: 62, speed: 6.2, style: 'fairy', desc: 'Such shot, very wow' },
  { id: 2, name: 'Pepe Sapo', rarity: 'RARA', rarityColor: '#4cc9f0', bodyColor: '#38b000', eyeColor: '#140c07', accent: '#70e000', bulletColor: '#70e000', damage: 2.3, cooldown: 58, speed: 5.8, style: 'creeper', desc: 'Feels good man' },
  { id: 3, name: 'Nyan Cat', rarity: 'RARA', rarityColor: '#4cc9f0', bodyColor: '#ffffff', eyeColor: '#140c07', accent: '#ff758f', bulletColor: '#e0aaff', damage: 2.5, cooldown: 55, speed: 6.0, style: 'ghost', desc: 'Mia e atira arco-íris' },
  { id: 4, name: 'Gato Banana', rarity: 'ÉPICA', rarityColor: '#c77dff', bodyColor: '#4cc9f0', eyeColor: '#140c07', accent: '#ffd166', bulletColor: '#ffd166', damage: 3.1, cooldown: 50, speed: 6.8, style: 'chao', desc: 'Lança cascas de banana' },
  { id: 5, name: 'Tralalero Mini', rarity: 'ÉPICA', rarityColor: '#c77dff', bodyColor: '#ff758f', eyeColor: '#140c07', accent: '#e63946', bulletColor: '#ff8fa3', damage: 3.4, cooldown: 48, speed: 6.6, style: 'kirby', desc: 'Tralalero Tralala!' },
  { id: 6, name: 'Barril do Chaves', rarity: 'LENDÁRIA', rarityColor: '#ffd166', bodyColor: '#ffd166', eyeColor: '#140c07', accent: '#e63946', bulletColor: '#ffd166', damage: 4.2, cooldown: 44, speed: 7.4, style: 'pikachu', desc: 'Foi sem querer querendo' },
  { id: 7, name: 'Skibidi Mini', rarity: 'MÍTICA', rarityColor: '#ff007f', bodyColor: '#70e000', eyeColor: '#e63946', accent: '#00f5d4', bulletColor: '#00f5d4', damage: 5.5, cooldown: 38, speed: 7.8, style: 'metroid', desc: 'Dib dib dop dop yes yes' }
];

for (const [skinId, id] of pokemonPetIds) {
  const i = skinId - 10000;
  const colors = ['#55bdf9', '#ffda42', '#ff783e'];
  PETS.push({...PETS[4], id, name: collectionSkins[i], spriteKey: 'EVENT' + i,
    desc: ['Jato de água','Choque elétrico','Brasa'][id - 8], bulletColor: colors[id - 8]});
}
function getPetById(id) { return PETS.find(p => p.id === id) || null; }
function getActivePet() { return equippedPetId >= 0 ? getPetById(equippedPetId) : null; }

function pick(items) { return items[Math.floor(Math.random() * items.length)]; }
const epicPetIds = PETS.filter(pet => pet.rarity === 'ÉPICA').map(pet => pet.id);
const PET_EGGS = [
  {
    id: 'egg_common', name: 'OVO DA FLORESTA', price: 75, shellColor: '#e5e5e5', spotColor: '#38b000', borderColor: '#80ed99',
    desc: 'Comum 65% • Rara 30% • Épica 5%',
    rollPet() {
      const r = Math.random();
      if (r < 0.65) return Math.random() < 0.5 ? 0 : 1;
      if (r < 0.95) return Math.random() < 0.5 ? 2 : 3;
      return pick(epicPetIds);
    }
  },
  {
    id: 'egg_gold', name: 'OVO DE HYRULE', price: 190, shellColor: '#ffd166', spotColor: '#ff9e00', borderColor: '#ffd166',
    desc: 'Rara 55% • Épica 35% • Lendária 10%',
    rollPet() {
      const r = Math.random();
      if (r < 0.55) return Math.random() < 0.5 ? 2 : 3;
      if (r < 0.90) return pick(epicPetIds);
      return 6;
    }
  },
  {
    id: 'egg_cosmic', name: 'OVO ESTELAR', price: 440, shellColor: '#c77dff', spotColor: '#5a189a', borderColor: '#e0aaff',
    desc: 'Épica 55% • Lendária 32% • Mítica 13%',
    rollPet() {
      const r = Math.random();
      if (r < 0.55) return pick(epicPetIds);
      if (r < 0.87) return 6;
      return 7;
    }
  },
  {
    id: 'egg_mythic', name: 'OVO METROID MÍTICO', price: 980, shellColor: '#ff007f', spotColor: '#00f5d4', borderColor: '#ff85a1',
    desc: 'Lendária 55% • MÍTICA 45% ✨',
    rollPet() {
      return Math.random() < 0.55 ? 6 : 7;
    }
  }
];

const weaponLoot = {};
for (const weapon of WEAPONS.slice(1)) {
  (weaponLoot[weapon.rarity] ??= []).push(weapon.id);
}
// A nova bazuca também pode sair na caixa mítica.
if (!weaponLoot['MÍTICA'].includes(bazucaEsmeralda.id)) weaponLoot['MÍTICA'].push(bazucaEsmeralda.id);
// Entrega a arma uma vez para que já possa ser testada no arsenal.
if (!ownedWeapons.includes(bazucaEsmeralda.id)) {
  ownedWeapons.push(bazucaEsmeralda.id);
  saveAllData();
}
const WEAPON_CRATES = [
  {
    id: 'w_solar', name: 'CAIXA ARMA MADEIRA', price: 65, color: '#ff9f1c', borderColor: '#ffd166',
    desc: 'Comum 60% • Rara 30% • Épica 10%',
    rollWeapon() {
      const r = Math.random();
      if (r < 0.60) return pick(weaponLoot['COMUM']);
      if (r < 0.90) return pick(weaponLoot['RARA']);
      return pick(weaponLoot['ÉPICA']);
    }
  },
  {
    id: 'w_estelar', name: 'CAIXA ARMA OURO', price: 180, color: '#4cc9f0', borderColor: '#90e0ef',
    desc: 'Rara 50% • Épica 35% • Lendária 15%',
    rollWeapon() {
      const r = Math.random();
      if (r < 0.50) return pick(weaponLoot['RARA']);
      if (r < 0.85) return pick(weaponLoot['ÉPICA']);
      return pick(weaponLoot['LENDÁRIA']);
    }
  },
  {
    id: 'w_cosmica', name: 'CAIXA ARMA BIOMA', price: 420, color: '#9d4edd', borderColor: '#e0aaff',
    desc: 'Épica 45% • Lendária 40% • Mítica 15%',
    rollWeapon() {
      const r = Math.random();
      if (r < 0.45) return pick(weaponLoot['ÉPICA']);
      if (r < 0.85) return pick(weaponLoot['LENDÁRIA']);
      return pick(weaponLoot['MÍTICA']);
    }
  },
  {
    id: 'w_suprema', name: 'CAIXA LUMINITA', price: 950, color: '#ff007f', borderColor: '#ff85a1',
    desc: 'Lendária 55% • MÍTICA 45% ✨',
    rollWeapon() {
      if (Math.random() < 0.55) return pick(weaponLoot['LENDÁRIA']);
      return pick(weaponLoot['MÍTICA']);
    }
  }
];

let chestAnim = { active: false, timer: 0, maxTimer: 210, rewardType: 'coins', title: '', subtitle: '', color: '#ffd166', wonSkinId: 0 };
let crateAnim = { active: false, timer: 0, maxTimer: 165, mode: 'weapon', crateName: '', crateColor: '#ffa200', rouletteIds: [], finalId: 0, eggShell: '#ffd166', eggSpot: '#ff9e00' };

function seededRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function getActiveSkin() { return {customHero:true,name:heroName||'Herói',accent:look.cloth,rarityColor:look.cloth}; }
// =========================================================================
// CAIXAS DE SKINS, OVOS DE PET & RECOMPENSAS
// =========================================================================
function saveAllData() {
  gameSave.setItem('solaris_v5_unlocked', unlockedLevel);
  gameSave.setItem('solaris_v5_deaths', deaths);
  gameSave.setItem('solaris_v5_coins', sunflowers);
  gameSave.setItem('solaris_v5_chests', JSON.stringify(openedChests));
  gameSave.setItem('solaris_v5_weapons', JSON.stringify(ownedWeapons));
  gameSave.setItem('solaris_v5_weapon', equippedWeaponId);
  gameSave.setItem('solaris_v5_pets', JSON.stringify(ownedPets));
  gameSave.setItem('solaris_v5_pet', equippedPetId);
  gameSave.setItem('solaris_v5_collection_loot', '1');
}

// =========================================================================
// ÁUDIO 16-BIT SINTETIZADO
// =========================================================================
let audioCtx = null;
let lastAudioTime = 0;

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, type, duration, vol = 0.055, slideFreq = null, delay = 0) {
  if (!soundEnabled) return;
  try {
    ensureAudio();
    const now = audioCtx.currentTime + delay;
    if (now - lastAudioTime < 0.015 && delay === 0) return;
    lastAudioTime = now;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideFreq) osc.frequency.exponentialRampToValueAtTime(slideFreq, now + duration);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {}
}

function sfxJump() { playTone(260, 'square', 0.11, 0.055, 520); }
function sfxSpring() { playTone(220, 'triangle', 0.22, 0.075, 760); }
function sfxKey() { playTone(660, 'square', 0.08, 0.06, 990); playTone(990, 'square', 0.12, 0.06, 1320, 0.07); }
function sfxChestOpen() {
  playTone(392, 'triangle', 0.10, 0.07, 523);
  playTone(523, 'triangle', 0.10, 0.07, 659, 0.08);
  playTone(784, 'square', 0.18, 0.07, 1046, 0.16);
}
function sfxShoot(style) {
  if (style === 'cannon') playTone(160, 'sawtooth', 0.14, 0.06, 70);
  else if (style === 'laser') playTone(760, 'sine', 0.07, 0.05, 340);
  else if (style === 'shotgun') playTone(240, 'square', 0.10, 0.055, 95);
  else playTone(480, 'square', 0.06, 0.045, 220);
}
function sfxPetShoot() { playTone(640, 'triangle', 0.05, 0.03, 440); }
function sfxParry() { playTone(740, 'triangle', 0.18, 0.085, 1180); }
function sfxBossHit() { playTone(160, 'sawtooth', 0.08, 0.055, 90); }
function sfxPlayerHurt() { playTone(180, 'sawtooth', 0.25, 0.085, 65); }
function sfxLightning() { playTone(290, 'sawtooth', 0.22, 0.065, 65); }
function sfxMogBling() {
  playTone(987.77, 'sine', 0.10, 0.07, 1318.51);
  playTone(1318.51, 'triangle', 0.18, 0.07, 1567.98, 0.08);
}
function sfxDie() { playTone(165, 'sawtooth', 0.32, 0.085, 45); }
function sfxWin() {
  [523.25, 659.25, 783.99, 1046.50].forEach((n, i) => playTone(n, 'square', 0.14, 0.06, null, i * 0.075));
}
function sfxClick() { playTone(440, 'triangle', 0.045, 0.045); }

// =========================================================================
// GERADOR PROCEDURAL DE 1.000 FASES + CHEFE 2 "MOGGER" (1000 HP, FASE ÚNICA)
// =========================================================================
const BOSS_TITLES = [
  'VERITY', 'MOGGER SUPREMO', 'CÉREBRO DE CARMIM', 'ABELHA RAINHA',
  'ESQUELETRON', 'PAREDE DE CARNE', 'OS GÊMEOS MECÂNICOS', 'DESTRUIDOR DE MUNDOS',
  'PLANTERA SELVAGEM', 'GOLEM DO TEMPLO', 'DUQUE PEIXE-DRAGÃO', 'IMPERATRIZ DA LUZ',
  'CULTISTA LUNÁTICO', 'SENHOR DA LUA', 'GUARDIÃO DO SOL', 'TITÃ ESTELAR',
  'ARCANJO DO ALVORECER', 'MONARCA DO ZÊNITE', 'DEUS DO SOL ETERNO', 'ENTIDADE OMEGA'
];

const PROP_TYPES = [
  'mario_block', 'zelda_triforce', 'master_sword', 'minecraft_sword',
  'sonic_ring', 'darksouls_bonfire', 'pokeball', 'terraria_crystal'
];

const MEMES = [
  { id: 'six7', name: '67 - SIX SEVEEEN', w: 82, h: 56 },
  { id: 'tung', name: 'TUNG TUNG TUNG SAHUR', w: 56, h: 80 },
  { id: 'skib', name: 'SKIBIDI TOILET', w: 64, h: 84 },
  { id: 'tral', name: 'TRALALERO TRALALA', w: 96, h: 56 },
  { id: 'bomb', name: 'BOMBARDIRO CROCODILO', w: 100, h: 44 },
  { id: 'ball', name: 'BALLERINA CAPPUCCINA', w: 44, h: 84 },
  { id: 'chad', name: 'GIGACHAD ETERNO', w: 60, h: 90 },
  { id: 'sus', name: 'IMPOSTOR SUS', w: 56, h: 76 },
  { id: 'rick', name: 'RICK ASTLEY ROLL', w: 48, h: 80 },
  { id: 'pedro', name: 'PEDRO PEDRO PEDRO', w: 56, h: 64 },
  { id: 'nyan', name: 'NYAN CAT ARCO-ÍRIS', w: 64, h: 44 },
  { id: 'doge', name: 'DOGE MUCH WOW', w: 64, h: 60 },
  { id: 'troll', name: 'TROLLFACE U MAD?', w: 64, h: 70 }
];
const THEME_NAMES = ['CLÁSSICA', 'GELO ESCORREGADIO', 'JATOS DE FOGO', 'MARTELOS PENDULARES', 'CRISTAIS DE PULO DUPLO'];

function updateMemeBoss(b) {
  const m = b.meme, px = player.x + 10, py = player.y + 14, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  b.t = (b.t || 0) + 1; b.timer--;
  const P = (x, y, vx, vy, r, c, o) => b.mp.push(Object.assign({ x, y, vx, vy, r, c }, o || {}));
  const aim = (sp, off) => { const a = Math.atan2(py - cy, px - cx) + off; return [Math.cos(a) * sp, Math.sin(a) * sp]; };
  if (m === 'six7') {
    b.y = 100 + Math.sin(b.t * 0.05) * 14; b.x += b.vx; if (b.x < 70 || b.x + b.w > 730) b.vx *= -1;
    if (b.timer <= 0) {
      b.timer = 95; b.atk = !b.atk;
      if (b.atk) { for (let i = 0; i < 5; i++) b.warn.push({ x: 50 + Math.random() * 700, t: 45 + i * 6, k: '6' }); }
      else { const d = Math.random() < 0.5 ? 1 : -1; P(d > 0 ? -20 : 820, 286, d * 4.6, 0, 12, '#ff9e00', { ch: '7', roll: true }); }
    }
  } else if (m === 'tung') {
    // TUNG TUNG: duelo de ritmo. As batidas marcam colunas sonoras que atravessam
    // a arena inteira (inclusive a plataforma mais alta); depois vem a investida.
    b.y = 300 - b.h;
    if (b.st === 'idle') {
      b.face = px > cx ? 1 : -1; b.x += b.face * 1.3;
      if (b.timer <= 0) { b.st = 'beat'; b.timer = 88; b.tungBeat = 0; }
    } else if (b.st === 'beat') {
      b.face = px > cx ? 1 : -1;
      if (b.timer === 70 || b.timer === 48 || b.timer === 26) {
        b.tungBeat++;
        playTone(105 + b.tungBeat * 22, 'square', 0.15, 0.12, 55);
        shakeTimer = 5; addShockwave(cx, 300, '#ffd166');
        // Cada batida marca uma coluna diferente. A terceira tenta cercar o jogador.
        const spread = b.tungBeat === 3 ? [-105, 0, 105] : [0];
        for (const off of spread) {
          const markX = Math.max(24, Math.min(776, px + off + (Math.random() - 0.5) * 26));
          b.warn.push({ x: markX, t: 34 + Math.abs(off) * 0.04, k: 'g', maxH: 292 });
        }
      }
      if (b.timer <= 0) { b.st = 'dash'; b.timer = 40; b.dir = b.face; }
    } else if (b.st === 'dash') {
      b.x += b.dir * 8.5;
      if (b.x < 10 || b.x + b.w > 790) {
        b.x = Math.max(10, Math.min(790 - b.w, b.x)); b.st = 'rest'; b.timer = 55;
        shakeTimer = 14; sfxLightning();
        // Baquetas caem nas zonas laterais enquanto as colunas sonoras desaparecem.
        for (let i = 0; i < 5; i++) P(55 + i * 172, -20, 0, 5.5, 10, '#8d5524', { fall: true, ch: '♪' });
      } else if (b.timer <= 0) { b.st = 'rest'; b.timer = 45; }
    } else if (b.timer <= 0) { b.st = 'idle'; b.timer = 62; }
    b.x = Math.max(10, Math.min(790 - b.w, b.x));
  } else if (m === 'skib') {
    b.y = 300 - b.h - Math.abs(Math.sin(b.t * 0.05)) * 46; b.x += Math.sign(px - cx) * 1.1;
    if (b.timer <= 0) {
      b.timer = 105; b.atk = !b.atk;
      if (b.atk) {
        const lane = Math.max(70, Math.min(730, px));
        for (let i = -1; i <= 1; i++) b.warn.push({ x: Math.max(45, Math.min(755, lane + i * 125)), t: 42 + (i + 1) * 9, k: 'g', maxH: 230 });
      } else {
        for (let k = -2; k <= 2; k++) { const v = aim(3.2, k * 0.22); P(cx, cy, v[0], v[1], 7, '#ff9e00', { ch: '♪' }); }
      }
    }
  } else if (m === 'bomb') {
    b.y = 60 + Math.sin(b.t * 0.04) * 8; b.dir = b.dir || 1; b.face = b.dir;
    b.x += b.dir * (b.st === 'run' ? 7 : 2.6);
    if (b.x < 10 || b.x + b.w > 790) { b.dir *= -1; b.x = Math.max(10, Math.min(790 - b.w, b.x)); }
    if (b.t % (b.st === 'run' ? 8 : 30) === 0) P(cx, b.y + 40, 0, 1.5, 9, '#6c757d', { fall: true, g: 0.1 });
    if (b.timer <= 0) { b.st = b.st === 'run' ? 'idle' : 'run'; b.timer = b.st === 'run' ? 70 : 150; if (b.st === 'run') playTone(220, 'sawtooth', 0.3, 0.07, 120); }
  } else if (m === 'ball') {
    b.y = 300 - b.h; b.face = px > cx ? 1 : -1; b.inv = b.st === 'tp';
    if (b.timer <= 0) {
      if (b.st === 'idle') { b.st = 'spin'; b.timer = 40; }
      else if (b.st === 'spin') {
        for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 + b.t * 0.05; P(cx, cy, Math.cos(a) * 2.8, Math.sin(a) * 2.8, 7, '#8d5524'); }
        b.tpX = b.x; b.tpY = b.y; b.st = 'tp'; b.timer = 30;
      } else {
        for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; P(b.tpX + b.w / 2, b.tpY + b.h / 2, Math.cos(a) * 3.4, Math.sin(a) * 3.4, 8, '#4cc9f0'); }
        b.x = 40 + Math.random() * (720 - b.w); b.st = 'idle'; b.timer = 90;
      }
    }
  } else if (m === 'chad') {
    b.vyy = b.vyy || 0;
    if (b.st === 'jump') {
      b.vyy += 0.5; b.y += b.vyy; b.x += (px - cx) * 0.03;
      if (b.y >= 300 - b.h && b.vyy > 0) { b.y = 300 - b.h; b.st = 'idle'; b.timer = 80; shakeTimer = 14; sfxLightning(); P(cx, 288, -4.2, 0, 10, '#ffd166', { roll: true, ch: '✦' }); P(cx, 288, 4.2, 0, 10, '#ffd166', { roll: true, ch: '✦' }); }
    } else { b.y = 300 - b.h; b.face = px > cx ? 1 : -1; b.x += b.face * 1.2; if (b.timer <= 0) { b.st = 'jump'; b.vyy = -11; } }
    b.x = Math.max(10, Math.min(790 - b.w, b.x));
  } else if (m === 'sus') {
    if (b.st === 'hide') { b.inv = true; b.y = 20; b.x += (px - cx) * 0.07; if (b.timer <= 0) { b.st = 'warn'; b.timer = 30; } }
    else if (b.st === 'warn') { b.inv = true; b.y = 20; if (b.timer <= 0) { b.st = 'slam'; b.inv = false; b.vyy = 0; } }
    else if (b.st === 'slam') {
      b.vyy += 1.5; b.y += b.vyy;
      if (b.y >= 300 - b.h) { b.y = 300 - b.h; b.st = 'idle'; b.timer = 100; shakeTimer = 14; sfxLightning(); P(cx, 288, -4.2, 0, 10, '#e63946', { roll: true, ch: '!' }); P(cx, 288, 4.2, 0, 10, '#e63946', { roll: true, ch: '!' }); }
    } else { b.inv = false; b.y = 300 - b.h; b.x += (px > cx ? 1 : -1) * 1.6; if (b.timer <= 0) { b.st = 'hide'; b.timer = 55; } }
    b.x = Math.max(10, Math.min(790 - b.w, b.x));
  } else if (m === 'rick') {
    b.y = 300 - b.h; b.x = 560 + Math.sin(b.t * 0.03) * 140;
    if (b.timer <= 0) {
      b.timer = 112; b.n = (b.n || 0) + 1;
      const lane = b.n % 3;
      for (let k = 0; k < 7; k++) {
        const y0 = lane === 0 ? 145 + k * 17 : lane === 1 ? 205 + k * 13 : 170 + k * 19;
        P(820 + k * 48, y0, -4.1, 0, 9, '#ffd166', { ch: '♫', life: 250 });
      }
    }
  } else if (m === 'pedro') {
    b.y = 300 - b.h - Math.abs(Math.sin(b.t * 0.07)) * 38; b.dir = b.dir || 1; b.x += b.dir * 2; if (b.x < 20 || b.x + b.w > 780) b.dir *= -1;
    if (b.timer <= 0) {
      b.timer = 80; b.n = (b.n || 0) + 1;
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * 6.283 + b.n * 0.4;
        const speed = b.n % 2 ? 3 : 4;
        P(cx, cy, Math.cos(a) * speed, Math.sin(a) * speed, 7, '#adb5bd');
      }
      if (b.n % 2 === 0) {
        const a = Math.atan2(py - cy, px - cx);
        for (let k = -1; k <= 1; k++) P(cx, cy, Math.cos(a + k * 0.18) * 4.2, Math.sin(a + k * 0.18) * 4.2, 8, '#f8f9fa', { ch: '🐾' });
      }
    }
  } else if (m === 'nyan') {
    b.dir = b.dir || 1; b.face = b.dir; b.x += b.dir * 3.4; b.y = 120 + Math.sin(b.t * 0.05) * 70; if (b.x < 10 || b.x + b.w > 790) b.dir *= -1;
    if (b.t % 7 === 0) {
      const colors = ['#e63946', '#ff9e00', '#ffd166', '#70e000', '#4cc9f0', '#7209b7'];
      const color = colors[((b.t / 7) | 0) % 6];
      const a = Math.atan2(py - cy, px - (cx - b.dir * 34));
      P(cx - b.dir * 34, cy, Math.cos(a) * 3.1, Math.sin(a) * 3.1, 7, color, { life: 125 });
    }
  } else if (m === 'doge') {
    b.face = px > cx ? 1 : -1;
    if (b.timer <= 0) {
      b.timer = 75; const sp = [[130, 222], [365, 168], [600, 222], [380, 300]][(Math.random() * 4) | 0]; b.x = sp[0]; b.y = sp[1] - b.h;
      for (let k = -1; k <= 1; k++) { const a = Math.atan2(py - (b.y + 30), px - (b.x + 32)) + k * 0.25; P(b.x + 32, b.y + 30, Math.cos(a) * 3.4, Math.sin(a) * 3.4, 12, '#ffd166', { ch: 'WOW' }); }
    }
  } else if (m === 'troll') {
    b.y = 110 + Math.sin(b.t * 0.04) * 18; b.x += b.vx; if (b.x < 60 || b.x + b.w > 740) b.vx *= -1;
    if (b.timer <= 0) { b.timer = 100; for (let i = 0; i < 4; i++) b.warn.push({ x: 80 + Math.random() * 640, t: 55, k: 'g', fake: Math.random() < 0.5 }); }
  } else if (m === 'tral') {
    if (b.st === 'dive') {
      b.x += b.dv[0]; b.y += b.dv[1]; b.face = b.dv[0] >= 0 ? 1 : -1;
      if (b.timer <= 0 || b.y > 244) {
        for (let k = -2; k <= 2; k++) P(Math.max(24, Math.min(776, cx + k * 48)), 286, 0, -2.2, 9, '#4cc9f0', { g: 0.16, life: 85, ch: '✦' });
        b.st = 'idle'; b.timer = 125;
      }
    } else {
      b.x += b.vx2; b.y += b.vy2; b.face = b.vx2 >= 0 ? 1 : -1;
      if (b.x < 20 || b.x + b.w > 780) b.vx2 *= -1;
      if (b.y < 40 || b.y > 200) b.vy2 *= -1;
      if (b.t % 55 === 0) for (let k = -1; k <= 1; k++) { const v = aim(3.6, k * 0.3); P(cx, cy, v[0], v[1], 7, '#4cc9f0'); }
      if (b.timer <= 0) { b.st = 'dive'; b.timer = 32; const a = Math.atan2(py - cy, px - cx); b.dv = [Math.cos(a) * 7.5, Math.sin(a) * 7.5]; playTone(400, 'sawtooth', 0.2, 0.07, 100); }
    }
  }
  for (let i = b.warn.length - 1; i >= 0; i--) {
    const w = b.warn[i]; w.t--;
    if (w.t <= 0) { if (w.k === '6') P(w.x, -20, 0, 6.5, 13, '#ffd166', { ch: '6', fall: true }); else if (w.fake) spawnFloatingText(w.x, 270, 'TROLLED!', '#ffffff'); else b.gey.push({ x: w.x, t: 36, h: 0, maxH: w.maxH || 160 }); b.warn.splice(i, 1); }
  }
  for (let i = b.gey.length - 1; i >= 0; i--) {
    const g = b.gey[i]; g.t--; g.h = g.t > 6 ? Math.min(g.maxH || 160, (36 - g.t) * Math.max(14, (g.maxH || 160) / 10)) : g.t * 20;
    if (rectIntersect(player.x, player.y, player.w, player.h, g.x - 14, 300 - g.h, 28, g.h)) damagePlayer();
    if (g.t <= 0) b.gey.splice(i, 1);
  }
  for (let i = b.mp.length - 1; i >= 0; i--) {
    const q = b.mp[i]; if (q.g) q.vy += q.g; q.x += q.vx; q.y += q.vy; if (q.wave) q.y = q.y0 + Math.sin(q.x * 0.045) * 48;
    if (q.life !== undefined && --q.life <= 0) { b.mp.splice(i, 1); continue; }
    if (q.fall && q.y >= 288) {
      spawnParticles(q.x, 300, q.c, 6, 2.5);
      if (m === 'bomb' && !q.burst) {
        P(q.x, 282, -3.6, -2.1, 9, '#ff6b35', { life: 95 });
        P(q.x, 282, 3.6, -2.1, 9, '#ff6b35', { life: 95 });
      }
      b.mp.splice(i, 1); continue;
    }
    if (q.x < -40 || q.x > 840 || q.y < -40 || q.y > 460) { b.mp.splice(i, 1); continue; }
    if (Math.abs(q.x - px) < q.r + 8 && Math.abs(q.y - py) < q.r + 12) { damagePlayer(); if (!q.roll) b.mp.splice(i, 1); }
  }
  if (!b.inv && rectIntersect(player.x, player.y, player.w, player.h, b.x + 8, b.y + 14, b.w - 16, b.h - 18)) damagePlayer();
}

const bossArt=Object.fromEntries(Object.entries({"slime": "assets/jogo/slime.png", "mogger": "assets/jogo/mogger.png", "six7": "assets/jogo/six7.png", "tung": "assets/jogo/tung.png", "skib": "assets/jogo/skib.png", "tral": "assets/jogo/tral.png", "bomb": "assets/jogo/bomb.png", "ball": "assets/jogo/ball.png", "chad": "assets/jogo/chad.png", "sus": "assets/jogo/sus.png", "rick": "assets/jogo/rick.png", "pedro": "assets/jogo/pedro.png", "nyan": "assets/jogo/nyan.png", "doge": "assets/jogo/doge.png", "troll": "assets/jogo/troll.png"}).map(([id,url])=>{const image=new Image();image.src=url;return [id,image];}));
function paintBoss(id,b,x,y,dir=1) {
  const image=bossArt[id];
  if (!image?.naturalWidth) return false;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(x+b.w/2),Math.round(y+b.h));
  ctx.scale(dir,1);
  if(b.hurtTimer>0)ctx.filter='brightness(1.8)';
  const w=Math.min(b.w*1.16,b.h*image.naturalWidth/image.naturalHeight);
  ctx.drawImage(image,-w/2,-b.h,w,b.h);ctx.restore();return true;
}
function drawMemeBoss(b) {
  const x = Math.round(b.x), y = Math.round(b.y), t = b.t || 0, m = b.meme, px = player.x + 10, alive = b.hp > 0;
  const R = (a, c, d, e, f) => { ctx.fillStyle = f; ctx.fillRect(Math.round(a), Math.round(c), d, e); };
  const O = (a, c, d, e, f) => { R(a - 2, c - 2, d + 4, e + 4, '#140c07'); R(a, c, d, e, f); };
  const eye = (a, c, s) => { O(a, c, s, s, '#fff'); R(a + (px > b.x + b.w / 2 ? s / 2 - 1 : 1), c + s / 3, s / 2, s / 2, '#140c07'); };
  ctx.save();
  if (b.inv) ctx.globalAlpha = 0.18;
  if (!alive) ctx.globalAlpha = Math.max(0, knockoutTimer / 95);
  else R(x + 4, 296, b.w - 8, 5, 'rgba(0,0,0,0.3)');
  if (paintBoss(m,b,x,y,['tral','bomb','nyan','doge'].includes(m)?(b.face||1):1)) {
    if (m==='sus' && b.st==='warn') R(x-4,20,64,280,'rgba(255,0,0,0.24)');
    if (m==='tung' && b.st==='beat' && b.timer%24>12) R(x-4,y,64,80,'rgba(255,60,60,.25)');
    if (m==='six7' && alive && b.timer>70) {ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 16px monospace';ctx.fillText(b.atk?'SIX!':'SEVEN!',x+41,y-10);}
  } else if (m === 'six7') {
    const F = [['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'], ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...']];
    F.forEach((g, n) => {
      const ox = x + n * 47, oy = y + Math.sin(t * 0.08 + n * Math.PI) * 8 + 4, col = n ? '#ff9e00' : '#ffd166';
      for (let pass = 0; pass < 2; pass++) g.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === '#') pass ? R(ox + i * 7, oy + j * 7, 7, 7, col) : R(ox + i * 7 - 2, oy + j * 7 - 2, 11, 11, '#140c07'); });
      O(ox - 12, oy + 22 + Math.sin(t * 0.16 + n * Math.PI) * 8, 9, 10, '#f1c27d');
      if (!n) { eye(ox + 8, oy + 30, 8); eye(ox + 19, oy + 30, 8); }
    });
    if (alive && b.timer > 70) { ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(b.atk ? 'SIX!' : 'SEVEN!', x + 42, y - 9); ctx.fillStyle = '#fff'; ctx.fillText(b.atk ? 'SIX!' : 'SEVEN!', x + 41, y - 10); }
  } else if (m === 'tung') {
    const f = b.face || 1;
    O(x + 4, y + 6, 48, 72, '#8d5524'); R(x + 4, y + 28, 48, 4, '#6f4518'); R(x + 4, y + 54, 48, 4, '#6f4518'); R(x + 4, y + 6, 48, 6, '#a9713a');
    eye(x + 10, y + 20, 14); eye(x + 30, y + 20, 14);
    R(x + 12, y + 44, 32, 8, '#140c07'); R(x + 14, y + 44, 6, 4, '#fff'); R(x + 36, y + 44, 6, 4, '#fff');
    R(x + 8, y + 76, 14, 4, '#140c07'); R(x + 34, y + 76, 14, 4, '#140c07');
    ctx.save(); ctx.translate(x + (f > 0 ? 50 : 6), y + 40);
    ctx.rotate((b.st === 'beat' ? -2.3 + Math.sin(t * 0.5) * 0.4 : b.st === 'dash' ? 1.2 : -0.7 + Math.sin(t * 0.1) * 0.12) * f);
    O(-4, -58, 9, 58, '#c9a26b'); R(-4, -50, 3, 3, '#adb5bd'); R(2, -40, 3, 3, '#adb5bd'); R(-4, -30, 3, 3, '#adb5bd'); ctx.restore();
    if (alive && b.st === 'beat' && b.timer % 24 > 12) R(x - 4, y, 64, 80, 'rgba(255,60,60,0.25)');
  } else if (m === 'skib') {
    O(x + 2, y + 50, 60, 34, '#e5e5e5'); R(x + 2, y + 50, 60, 6, '#adb5bd'); O(x - 2, y + 44, 68, 8, '#ced4da'); R(x + 10, y + 60, 10, 18, '#fff');
    O(x + 10, y, 44, 46, '#f1c27d'); R(x + 10, y, 44, 10, '#583101');
    eye(x + 16, y + 14, 12); eye(x + 34, y + 14, 12);
    R(x + 20, y + 32, 24, 10, '#140c07'); R(x + 24, y + 38, 16, 4, '#e63946'); R(x + 6 + ((t * 2) % 50), y + 82, 3, 3, '#4cc9f0');
  } else if (m === 'bomb') {
    ctx.save(); ctx.translate(x + 50, 0); ctx.scale(b.face || 1, 1);
    O(-56, y + 14, 12, 10, '#2b9348'); O(-46, y + 10, 86, 24, '#38b000'); R(-40, y + 26, 74, 8, '#a7c957'); O(34, y + 12, 16, 16, '#38b000');
    R(34, y + 26, 16, 3, '#140c07'); R(36, y + 24, 3, 3, '#fff'); R(43, y + 24, 3, 3, '#fff'); O(18, y + 8, 8, 8, '#fff'); R(22, y + 10, 4, 4, '#e63946');
    O(-14, y - 2, 28, 8, '#6c757d'); O(-14, y + 32, 28, 8, '#6c757d'); R(52, y + 6 + ((t >> 1) % 2) * 14, 3, 10, '#adb5bd');
    ctx.restore();
  } else if (m === 'ball') {
    const wob = b.st === 'spin' ? Math.sin(t * 0.6) * 4 : 0;
    O(x + 12 + wob, y + 40, 20, 26, '#ff8fa3'); O(x + wob, y + 58, 44, 8, '#ffd1dc'); R(x + 14 + wob, y + 66, 5, 18, '#f1c27d'); R(x + 25 + wob, y + 66, 5, 18, '#f1c27d');
    O(x + 38 + wob, y + 12, 8, 14, '#fff'); O(x + 4 + wob, y, 36, 38, '#fff'); R(x + 6 + wob, y + 4, 32, 8, '#6f4518');
    eye(x + 10 + wob, y + 16, 9); eye(x + 25 + wob, y + 16, 9); R(x + 16 + wob, y + 30, 12, 3, '#e63946');
  } else if (m === 'chad') {
    O(x, y + 34, 12, 32, '#f1c27d'); O(x + 48, y + 34, 12, 32, '#f1c27d'); O(x + 10, y + 30, 40, 46, '#1d3557');
    O(x + 14, y + 74, 14, 16, '#212529'); O(x + 32, y + 74, 14, 16, '#212529');
    O(x + 14, y, 32, 32, '#f1c27d'); R(x + 14, y + 26, 32, 6, '#d9a566'); O(x + 12, y - 4, 36, 8, '#583101');
    R(x + 16, y + 12, 28, 6, '#140c07'); R(x + 19, y + 13, 6, 2, '#fff'); R(x + 24, y + 24, 12, 2, '#140c07');
  } else if (m === 'sus') {
    if (b.st === 'warn') R(x - 4, 20, 64, 280, 'rgba(255,0,0,' + (0.15 + 0.15 * Math.sin(t)) + ')');
    O(x - 6, y + 28, 12, 26, '#a4161a'); O(x + 6, y + 16, 44, 50, '#e63946'); R(x + 12, y + 10, 32, 8, '#e63946');
    O(x + 22, y + 22, 28, 18, '#90e0ef'); R(x + 26, y + 25, 10, 3, '#fff'); O(x + 10, y + 62, 16, 14, '#e63946'); O(x + 30, y + 62, 16, 14, '#e63946');
  } else if (m === 'rick') {
    const sw = Math.sin(t * 0.2) * 6;
    O(x - 8, y + 34 + sw, 10, 24, '#212529'); O(x + 46, y + 34 - sw, 10, 24, '#212529'); O(x + 4, y + 30, 40, 36, '#212529'); R(x + 22, y + 30, 4, 20, '#e63946');
    O(x + 8, y + 66, 14, 14, '#1d3557'); O(x + 26, y + 66, 14, 14, '#1d3557');
    O(x + 8, y, 32, 30, '#f1c27d'); O(x + 6, y - 8, 36, 12, '#ff7b00'); R(x + 14, y + 12, 5, 5, '#140c07'); R(x + 29, y + 12, 5, 5, '#140c07'); R(x + 18, y + 22, 12, 5, '#140c07');
  } else if (m === 'pedro') {
    O(x + 48, y + 40, 12, 18, '#adb5bd'); R(x + 48, y + 46, 12, 3, '#212529'); O(x + 6, y + 24, 44, 38, '#6c757d'); O(x + 10, y, 36, 28, '#adb5bd');
    R(x + 8, y - 4, 8, 6, '#6c757d'); R(x + 40, y - 4, 8, 6, '#6c757d'); R(x + 12, y + 10, 32, 8, '#212529'); R(x + 16, y + 11, 6, 5, '#fff'); R(x + 34, y + 11, 6, 5, '#fff'); R(x + 25, y + 20, 6, 4, '#140c07');
  } else if (m === 'nyan') {
    ctx.save(); ctx.translate(x + 32, 0); ctx.scale(b.face || 1, 1);
    O(-26, y + 4, 44, 34, '#e0a97a'); R(-22, y + 8, 36, 26, '#ff8fa3'); R(-14, y + 14, 3, 3, '#e63946'); R(2, y + 22, 3, 3, '#e63946'); R(-6, y + 12, 3, 3, '#7209b7');
    O(8, y + 12, 24, 22, '#6c757d'); R(10, y + 8, 5, 6, '#6c757d'); R(26, y + 8, 5, 6, '#6c757d'); R(14, y + 18, 4, 4, '#fff'); R(24, y + 18, 4, 4, '#fff'); R(18, y + 26, 6, 2, '#e63946');
    R(-18, y + 38, 6, 5, '#6c757d'); R(4, y + 38, 6, 5, '#6c757d'); ctx.restore();
  } else if (m === 'doge') {
    O(x + 8, y + 20, 48, 36, '#ffd166'); O(x + 22, y, 36, 28, '#ffd166'); R(x + 22, y - 6, 6, 8, '#e0a800'); R(x + 52, y - 6, 6, 8, '#e0a800');
    R(x + 34, y + 14, 24, 12, '#fff'); R(x + 50, y + 14, 6, 5, '#140c07'); R(x + 34, y + 8, 5, 5, '#140c07'); R(x + 46, y + 8, 5, 5, '#140c07'); R(x + 12, y + 54, 8, 6, '#e0a800'); R(x + 40, y + 54, 8, 6, '#e0a800');
  } else if (m === 'troll') {
    O(x, y, 64, 70, '#f8f9fa'); R(x + 4, y + 24, 8, 3, '#adb5bd'); R(x + 52, y + 24, 8, 3, '#adb5bd'); R(x + 14, y + 20, 10, 6, '#140c07'); R(x + 40, y + 20, 10, 6, '#140c07');
    R(x + 12, y + 12, 14, 3, '#140c07'); R(x + 38, y + 8, 14, 3, '#140c07'); R(x + 8, y + 40, 48, 16, '#140c07'); R(x + 10, y + 40, 44, 6, '#fff'); R(x + 10, y + 50, 44, 4, '#fff');
  } else if (m === 'tral') {
    ctx.save(); ctx.translate(x + 48, 0); ctx.scale(b.face || 1, 1);
    O(-44, y + 12, 86, 30, '#4a6fa5'); R(-40, y + 32, 80, 8, '#cfe0f5'); O(34, y + 16, 16, 20, '#4a6fa5'); O(-54, y + 8, 12, 14, '#4a6fa5');
    R(-8, y, 16, 12, '#35527f'); R(-4, y - 6, 8, 6, '#35527f'); O(18, y + 16, 9, 9, '#fff'); R(22, y + 19, 4, 4, '#140c07');
    R(30, y + 34, 22, 3, '#140c07'); R(34, y + 31, 3, 3, '#fff'); R(42, y + 31, 3, 3, '#fff');
    for (let i = 0; i < 3; i++) { const lx = -30 + i * 26 + Math.sin(t * 0.3 + i * 2) * 3; R(lx, y + 42, 7, 8, '#4a6fa5'); O(lx - 4, y + 48, 18, 7, '#e63946'); R(lx - 4, y + 53, 18, 2, '#fff'); }
    ctx.restore();
  }
  if (alive) {
    if (b.hurtTimer > 0) R(x - 4, y - 8, b.w + 8, b.h + 12, 'rgba(255,255,255,0.35)');
    const a = 0.18 + 0.18 * Math.sin(t * 0.6);
    for (const w of b.warn) { if (w.k === 'g') { R(w.x - 17, w.maxH ? 0 : 282, 34, w.maxH ? 300 : 18, w.maxH ? 'rgba(255,209,102,' + (a + 0.25) + ')' : 'rgba(76,201,240,' + (a + 0.2) + ')'); } else R(w.x - 14, 0, 28, 300, 'rgba(255,80,80,' + a + ')'); }
    for (const g of b.gey) { O(g.x - 14, 300 - g.h, 28, g.h, '#4cc9f0'); R(g.x - 5, 300 - g.h, 10, g.h, '#fff'); }
    ctx.textAlign = 'center'; ctx.font = 'bold 26px Courier New'; ctx.lineWidth = 4; ctx.strokeStyle = '#140c07';
    for (const q of b.mp) {
      if (q.ch) { ctx.strokeText(q.ch, q.x, q.y + 9); ctx.fillStyle = q.c; ctx.fillText(q.ch, q.x, q.y + 9); }
      else { O(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2, q.c); R(q.x - 2, q.y - 2, 4, 4, '#fff'); }
    }
  }
  ctx.restore();
}

const sawPicture=new Image(), ironPicture=new Image();
sawPicture.src='assets/jogo/sawPicture.png';ironPicture.src='assets/jogo/ironPicture.png';
function blade(x,y,r,active=true){
  ctx.save();ctx.translate(x,y);ctx.rotate(levelTime*(active ? .09 : .025));
  ctx.imageSmoothingEnabled=false;ctx.globalAlpha=active?1:.38;
  if(sawPicture.naturalWidth)ctx.drawImage(sawPicture,-r,-r,r*2,r*2);
  else{ctx.fillStyle='#c6e7ee';ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
function bladeTouches(x,y,r){
  const dx=x-Math.max(player.x+2,Math.min(x,player.x+player.w-2));
  const dy=y-Math.max(player.y+2,Math.min(y,player.y+player.h-2));
  return dx*dx+dy*dy<(r-1)*(r-1);
}
function stepRoom(){
  if(level.training){
    if(level.training.phase==='path' && level.training.lesson===3 && player.grounded && player.x>=400){
      level.training.phase='arena';level.training.checkpoint=412;level.isBoss=true;
      level.name='Faísca';level.boss=trainBoss();level.training.lesson=4;showTrainingGuide();updateUI();
    }
    return;
  }
  updateRiver();
}
function paintRoom(){if(level.river)paintRiver();}
function objectiveText(){
  if(!level.training)return riverHint();
  if(level.door.open)return 'Treino concluído! Entre no portal.';
  return level.isBoss?'Acerte o Faísca e desvie quando ele piscar.':'Siga o guia pelo Pátio do Sol.';
}
function generateLevel(idx) {
  const isBoss = (idx + 1) % 20 === 0;
  const chapter = Math.floor(idx / 20);
  const stageInChapter = idx % 20;
  const biome = getBiomeForLevel(idx);

  const lvl = {
    name: isBoss ? BOSS_TITLES[chapter % BOSS_TITLES.length] : `FASE ${idx + 1} - ${biome.name}`,
    isBoss,
    spawn: { x: 40, y: 255 },
    door: { x: 742, y: 245, w: 28, h: 45, open: true },
    keyItem: null,
    levelChest: null,
    singleProp: null,
    platforms: [],
    spikes: [],
    saws: [],
    springs: [],
    cannons: [],
    darts: [],
    fallingRocks: [],
    boss: null
  };

  if (isBoss) {
    lvl.platforms.push({ x: 0, y: 300, w: 800, h: 150, type: 'solid' });
    lvl.platforms.push({ x: 100, y: 254, w: 178, h: 12, type: 'solid', oneWay: true });
    lvl.platforms.push({ x: 522, y: 254, w: 178, h: 12, type: 'solid', oneWay: true });
    lvl.platforms.push({ x: 315, y: 210, w: 170, h: 12, type: 'solid', oneWay: true });
    lvl.door.y = 255;
    lvl.door.open = false;

    const isMogger = (chapter === 1); // Capítulo 2 (Fase 40) = Segundo Boss: MOGGER
    lvl.boss = {
      chapter,
      bossType: isMogger ? 'mogger' : 'default',
      x: isMogger ? 560 : 560,
      y: isMogger ? 140 : 125,
      w: isMogger ? 84 : 72,
      h: isMogger ? 160 : 72,
      vx: isMogger ? 1.5 : 2.2,
      vy: 0,
      hp: isMogger ? 2500 : (chapter === 0 ? 200 : 600),
      maxHp: isMogger ? 2500 : (chapter === 0 ? 200 : 600),
      phase: 1,
      singlePhase: isMogger,
      state: 'float',
      timer: 55,
      hurtTimer: 0,
      animPhase: 0,
      castingTimer: 0,
      chinStrokeTimer: 0,
      armPunch: { active: false, progress: 0, dir: -1, y: 230, hitDone: false },
      projectiles: [],
      minions: [],
      lightnings: [],
      extraShots: [],
      extraAttackTimer: 80
    };
    if (chapter >= 2) {
      const mm = MEMES[(chapter - 2) % MEMES.length];
      Object.assign(lvl.boss, { bossType: 'meme', meme: mm.id, w: mm.w, h: mm.h, x: 560, y: 300 - mm.h, hp: 2200, maxHp: 2200,
        singlePhase: true, mp: [], warn: [], gey: [], st: 'idle', atk: false, vx: 1.6, vx2: 3, vy2: 2, timer: 70 });
      lvl.name = mm.name;
    }
  } else if(Math.random()<.20) {
    lvl.levelChest={w:28,h:22,opened:false,lidAngle:0};
  }
  buildRiver(lvl,idx);
  return lvl;
}
function starGoals(idx) {
  if((idx+1)%20===0)return [75,140];
  const count=scriptsOfRiver[idx%20].length;return count===1?[18,34]:[30,55];
}
function rateTime(idx, seconds) {
  const [gold, silver] = starGoals(idx);
  return seconds <= gold ? 3 : seconds <= silver ? 2 : 1;
}
const stageStars = safeJSON('solaris_time_stars', {});
const claimedBonuses = safeJSON('solaris_v5_petal_medals', {});
for (const [key, seconds] of Object.entries(safeJSON('solaris_v5_best', {}))) {
  const idx = Number(key.split('_')[0]);
  if (Number.isInteger(idx) && idx >= 0 && idx < TOTAL_LEVELS && Number.isFinite(seconds) && seconds > 0)
    stageStars[idx] = Math.max(stageStars[idx] || 0, rateTime(idx, seconds));
}
for (const idx of Object.keys(claimedBonuses)) if (claimedBonuses[idx] && !stageStars[idx]) stageStars[idx] = 1;
const resultFrames = 105;
let finishStars = 0;
let level = generateLevel(0);

const player = {
  x: 40, y: 255, w: 20, h: 28,
  vx: 0, vy: 0,
  speed: 3.1, jumpPower: -8.3,
  grounded: false, coyoteTimer: 0, jumpBuffer: 0,
  facing: 1, walkAnim: 0, squashX: 1, squashY: 1,
  hp: 3, maxHp: 3, invulnTimer: 0, parryTimer: 0
};

const companion = {
  x: 20, y: 230,
  shootTimer: 45,
  bobPhase: 0,
  recoil: 0
};

function makeTrainingMap(){
  const tiles=[[0,308,174],[219,288,121],[382,308,418]].map(([x,y,w])=>({x,y,w,h:450-y,type:'solid'}));
  return {training:{lesson:0,phase:'path',checkpoint:40},name:'Pátio do Sol',spawn:{x:40,y:275},
    isBoss:false,boss:null,platforms:tiles,door:{x:745,y:263,w:28,h:45,open:false},
    expedition:{tiles,goal:-1,marks:[],progress:0,done:false,emitter:{},trap:-1},
    spikes:[],saws:[],springs:[],cannons:[],darts:[],fallingRocks:[],maces:[],crystals:[],vents:[]};
}
function trainBoss(){
  const hp=Math.max(18,Math.round(getActiveWeapon().damage*4));
  return {training:true,chapter:-1,bossType:'drone',hp,maxHp:hp,phase:1,singlePhase:true,
    x:641,y:250,w:44,h:37,timer:130,animPhase:0,hurtTimer:0,castingTimer:0,
    projectiles:[],extraShots:[],minions:[],lightnings:[],armPunch:{active:false}};
}
function updateTraining(b){
  b.y=249+Math.sin(b.animPhase*.4)*12;
  if(--b.timer<=0){
    const bearing=Math.atan2(player.y+14-b.y-18,player.x+10-b.x-22);
    b.projectiles.push({x:b.x+22,y:b.y+18,vx:Math.cos(bearing)*2.1,vy:Math.sin(bearing)*2.1,r:6,isPink:false});
    b.timer=145;sfxClick();
  }
  for(let i=b.projectiles.length-1;i>=0;i--){
    const q=b.projectiles[i];q.x+=q.vx;q.y+=q.vy;
    if(rectIntersect(player.x+2,player.y+2,player.w-4,player.h-4,q.x-5,q.y-5,10,10)){
      b.projectiles.splice(i,1);damagePlayer();
    }else if(q.x<0||q.x>800||q.y<0||q.y>450)b.projectiles.splice(i,1);
  }
}
function paintTrainingDrone(b){
  const x=Math.round(b.x),y=Math.round(b.y);
  ctx.save();ctx.fillStyle='#192b3a';ctx.fillRect(x,y+7,44,23);ctx.fillRect(x+7,y+2,30,32);
  ctx.fillStyle=b.hurtTimer?'#fff6ca':'#f5ae43';ctx.fillRect(x+3,y+10,38,16);ctx.fillRect(x+10,y+5,24,26);
  ctx.fillStyle='#273948';ctx.fillRect(x+6,y+12,31,10);
  ctx.fillStyle=b.timer<35?'#ff815a':'#84edda';ctx.fillRect(x+9,y+14,14,5);
  ctx.fillStyle='#ffe49c';ctx.fillRect(x-5,y+6,9,4);ctx.fillRect(x+40,y+6,9,4);
  ctx.fillStyle='#86ded4';ctx.fillRect(x+12,y+33,5,3+(Math.floor(b.animPhase*4)%4));ctx.fillRect(x+27,y+33,5,4);
  if(b.timer<35){ctx.fillStyle='#ffdc82';ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText('!',x+22,y-4);}
  ctx.restore();
}
let trainingReturn=null;
const guide=document.getElementById('guideDialog');
let guideSeen=false;
try{guideSeen=gameSave.getItem('solaris_guide_v1')==='1';}catch{}
function showTrainingGuide(){
  const key=id=>keyLabel(controls[id].key);
  const lines=[
    touchMode?'Ande um pouco com ◀ ou ▶.':`Ande um pouco com ${key('left')} ou ${key('right')}.`,
    touchMode?'Toque no botão de pulo para saltar.':`Aperte ${key('jump')} para pular.`,
    touchMode?'Durante o salto, toque em Impulso.':`Durante o salto, aperte ${key('dash')} para dar um impulso.`,
    'Atravesse os vãos e pouse na plataforma da arena, à direita.',
    touchMode?'Segure o botão de tiro para derrotar o Faísca.':controls.arrowFire?'Mire com as setas e segure para atirar no Faísca.':`Segure ${key('fire')} para atirar no Faísca, ou mire e clique nele.`,
    'Boa! O portal dourado abriu. Entre nele para terminar o treino.'
  ];
  document.getElementById('guideChoices').hidden=false;
  const step=level.training.lesson;
  guide.hidden=false;
  document.getElementById('guideTitle').textContent='Guia do Solaris · '+(step+1)+'/'+lines.length;
  const line=(step===0 && heroName ? heroName+', ' : '')+lines[step];
  const box=document.getElementById('guideLine');
  if(box.textContent!==line || level.training.voiced!==step)speakLine('Guia',line);
  level.training.voiced=step;box.textContent=line;
  document.getElementById('guideNext').hidden=step>=3;
  fitCanvas();
}
function passTrainingStep(expected){
  if(level?.training?.lesson!==expected)return;
  level.training.lesson++;
  showTrainingGuide();
}
function openGuide(){
  if(dialog.open)return;
  if(screen==='playing' && level.training){showTrainingGuide();return;}
  trainingReturn=screen==='playing'?currentLevel:null;
  startLevel(0,true);
}
function finishGuide(){
  silenceVoice();
  guideSeen=true;try{gameSave.setItem('solaris_guide_v1','1');}catch{}
  guide.hidden=true;fitCanvas();
  const idx=trainingReturn;trainingReturn=null;
  if(idx===null)goMap();else startLevel(idx);
}
function advanceGuide(){
  if(level?.training && level.training.lesson<3)passTrainingStep(level.training.lesson);
}
const keys = {};
window.addEventListener('keydown', e => {
  if(dialog.open)return;
  const code = screen === 'playing' ? gameCode(e.code) : e.code;
  if (e.code.startsWith('Arrow') || code === 'Space') e.preventDefault();
  keys[code] = true;

  if (chestAnim.active) {
    if (code === 'Space' || code === 'Enter') {
      if (chestAnim.timer < chestAnim.maxTimer - 55) { chestAnim.active = false; sfxClick(); }
    }
    return;
  }
  if (crateAnim.active) {
    if (code === 'Space' || code === 'Enter') {
      if (crateAnim.timer < crateAnim.maxTimer - 40) { crateAnim.active = false; sfxClick(); }
    }
    return;
  }

  if (code === 'KeyP' && screen === 'playing') { paused = !paused; sfxClick(); return; }
  if (code === 'Escape') {
    paused = false;
    if (screen === 'playing') goMap();
    return;
  }

  if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
    if (screen === 'playing') {
      player.jumpBuffer = 6;
      if (!player.grounded && level.isBoss) {
        player.parryTimer = 11;
      }
    } else if (screen === 'title') {
      goMap();
    }
  }

  if ((code === 'ShiftLeft' || code === 'ShiftRight') && !e.repeat) startDash();
  if ((code === 'KeyJ' || code === 'KeyZ') && screen === 'playing') {
    tryPlayerShoot(false);
  }
});
window.addEventListener('keyup', e => {
  if(dialog.open)return;
  const code = screen === 'playing' ? gameCode(e.code) : e.code;
  keys[code] = false;
  if ((code === 'Space' || code === 'KeyW' || code === 'ArrowUp') && player.jumping && player.vy < -3) player.vy *= 0.45;
});
function releaseAll() { fingers.clear(); for (const k in keys) keys[k] = false; mouse.down = false; if (screen === 'playing') paused = true; }
window.addEventListener('blur', releaseAll);
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left - canvas.clientLeft) * (canvas.width / canvas.clientWidth);
  mouse.y = (e.clientY - rect.top - canvas.clientTop) * (canvas.height / canvas.clientHeight);
  mouse.active = true;
});

window.addEventListener('mouseup', () => {
  mouse.down = false;
});

function updateUI() {
  const talk=document.getElementById('talkTrail');if(talk)talk.hidden=screen!=='playing'||!level.river;
  if(!guide.hidden && (screen!=='playing'||(!level?.training && !level?.story?.until))){guide.hidden=true;silenceVoice();fitCanvas();}
  document.getElementById('coinCounter').textContent = `🌻 ${sunflowers}`;
  document.getElementById('deathCounter').textContent = `💀 ${deaths}`;
  const st = document.getElementById('statusText');
  if (screen === 'title') st.textContent = 'SOLARIS 16-BIT • 10.000 PORTAIS & PETS';
  else if (screen === 'map') st.textContent = `MUNDO ${mapPage + 1}/${TOTAL_LEVELS/20} • LIBERADO: ${unlockedLevel + 1}`;
  else if (screen === 'shop') st.textContent = `LOJA: CAIXAS & OVOS DE PET`;
  else if (screen === 'weapons') st.textContent = `ARMAS: ${ownedWeapons.length}/${WEAPONS.length} (${getActiveWeapon().name})`;
  else if (screen === 'pets') {
    const ap = getActivePet();
    st.textContent = `PETS: ${ownedPets.length}/${PETS.length} (${ap ? ap.name : 'NENHUM EQUIPADO'})`;
  } else {
    const diffLabel = getDiffConfig().name;
    if(level.training){st.textContent=level.isBoss?'TREINO • FAÍSCA':'TREINO • PÁTIO DO SOL';return;}
    st.textContent = `${level.story.region} · ${level.story.title} · Portal ${currentLevel+1} [${diffLabel}]`;
  }
}

function goTitle(btn) { if (btn) btn.blur(); screen = 'title'; sfxClick(); updateUI(); }
function goMap(btn) { if (btn) btn.blur(); screen = 'map'; sfxClick(); updateUI(); }
function goShop(btn) { if (btn) btn.blur(); screen = 'shop'; sfxClick(); updateUI(); }
function goWeapons(btn) { if (btn) btn.blur(); screen = 'weapons'; sfxClick(); updateUI(); }
function goPets(btn) { if (btn) btn.blur(); screen = 'pets'; sfxClick(); updateUI(); }

function toggleSound(btn) {
  if (btn) btn.blur();
  soundEnabled = !soundEnabled;
  if(!soundEnabled)silenceVoice();
  document.getElementById('soundBtn').textContent = soundEnabled ? '🔊' : '🔇';
}

function changeMapPage(delta) {
  mapPage = Math.max(0, Math.min(TOTAL_LEVELS/20-1, mapPage + delta));
  sfxClick();
  updateUI();
}

function changeWepPage(delta) {
  const maxPage = Math.ceil(WEAPONS.length / 8) - 1;
  wepPage = Math.max(0, Math.min(maxPage, wepPage + delta));
  sfxClick();
}

function promptStartLevel(idx) {
  if (idx > unlockedLevel) return;
  sfxClick();
  startLevel(idx);
}

function startLevel(idx,training=false) {
  if(!training&&!guideSeen){trainingReturn=idx;training=true;}
  currentLevel = idx;
  level = training?makeTrainingMap():generateLevel(idx);
  player.supportTile=null;player.launchedFrom=null;player.landedOn=null;
  player.x = level.spawn.x;
  player.y = level.spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  player.facing = 1;
  player.hp = 3;
  player.invulnTimer = 0;
  player.parryTimer = 0;
  player.jumping = false;
  player.coyoteTimer = 0; player.jumpBuffer = 0;
  player.dashReady = true; player.dashFrames = 0; player.dashDir = 1;
  player.onIce = false;
  paused = false;
  levelTime = 0;
  bestTime = (safeJSON('solaris_v5_best', {}))[idx + '_' + currentDifficulty] || 0;

  companion.x = player.x - 18;
  companion.y = player.y - 16;
  companion.shootTimer = 45;
  companion.recoil = 0;

  deadTimer = 0;
  diedToBoss = false;
  enterDoorTimer = 0;
  spawnAnimTimer = training?0:16;
  bossBannerTimer = level.isBoss ? 125 : 0;
  knockoutTimer = 0;
  particles = [];
  floatingTexts = [];
  shockwaves = [];
  playerBullets = [];
  petBullets = [];
  shootCooldown = 0;
  weaponRecoil = 0;
  muzzleFlashTimer = 0;
  screen = 'playing';
  greetTrail();
  updateUI();
  if(training)showTrainingGuide();
}

function buyWeaponCrate(crateIndex) {
  const crate = WEAPON_CRATES[crateIndex];
  if (sunflowers < crate.price) {
    playTone(130, 'sawtooth', 0.16, 0.08);
    return;
  }
  sunflowers -= crate.price;
  const wonWepId = crate.rollWeapon();
  if (!ownedWeapons.includes(wonWepId)) ownedWeapons.push(wonWepId);
  equippedWeaponId = wonWepId;
  saveAllData();
  updateUI();

  const roulette = [];
  for (let i = 0; i < 30; i++) roulette.push(crate.rollWeapon());
  roulette.push(wonWepId);

  crateAnim = {
    active: true, timer: 165, maxTimer: 165, mode: 'weapon',
    crateName: crate.name, crateColor: crate.borderColor,
    rouletteIds: roulette, finalId: wonWepId
  };
  sfxWin();
}

function buyPetEgg(eggIndex) {
  const egg = PET_EGGS[eggIndex];
  if (sunflowers < egg.price) {
    playTone(130, 'sawtooth', 0.16, 0.08);
    return;
  }
  sunflowers -= egg.price;
  const wonPetId = egg.rollPet();
  if (!ownedPets.includes(wonPetId)) ownedPets.push(wonPetId);
  equippedPetId = wonPetId;
  saveAllData();
  updateUI();

  const roulette = [];
  for (let i = 0; i < 30; i++) roulette.push(egg.rollPet());
  roulette.push(wonPetId);

  crateAnim = {
    active: true, timer: 165, maxTimer: 165, mode: 'pet',
    crateName: egg.name, crateColor: egg.borderColor,
    rouletteIds: roulette, finalId: wonPetId,
    eggShell: egg.shellColor, eggSpot: egg.spotColor
  };
  sfxWin();
}

function triggerChestReward(labelOrigin, luck = 1) {
  // Mil resultados equiprováveis. A sorte transfere resultados de moedas para itens.
  const roll = Math.floor(Math.random() * 1000);
  sfxChestOpen();
  chestAnim={active:true,timer:195,maxTimer:195,color:'#ffd166',subtitle:labelOrigin};
  if(roll<50*luck){
    const id=PET_EGGS[2].rollPet();if(!ownedPets.includes(id))ownedPets.push(id);
    Object.assign(chestAnim,{rewardType:'pet',id,title:'Pet: '+PETS[id].name});
  }else if(roll<200*luck){
    const id=WEAPON_CRATES[2].rollWeapon();if(!ownedWeapons.includes(id))ownedWeapons.push(id);
    Object.assign(chestAnim,{rewardType:'weapon',id,title:'Arma: '+WEAPONS[id].name});
  }else{
    const bonus=45+Math.floor(Math.random()*40)+Math.floor(currentLevel/12)*12;
    sunflowers+=bonus;Object.assign(chestAnim,{rewardType:'coins',title:'🌻 +'+bonus+' GIRASSÓIS!'});
  }
  saveAllData();
  updateUI();
}

function openChest(chapterIdx) {
  if (unlockedLevel < (chapterIdx + 1) * 20 && !stageStars[(chapterIdx + 1) * 20 - 1]) return;
  if (openedChests.includes(chapterIdx)) return;
  openedChests.push(chapterIdx);
  triggerChestReward(`Tesouro do Capítulo ${chapterIdx + 1}`, 2);
}

// =========================================================================
// PARTÍCULAS E TEXTOS FLUTUANTES
// =========================================================================
function spawnParticles(x, y, color, count = 12, speed = 3.5) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 0.8 + Math.random() * speed;
    particles.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 1.2,
      size: 2 + Math.floor(Math.random() * 3),
      color,
      life: 16 + Math.floor(Math.random() * 14)
    });
  }
}

function spawnFloatingText(x, y, text, color = '#ffd166') {
  floatingTexts.push({ x, y, text, color, life: 42 });
}

function addShockwave(x, y, color = '#ffffff') {
  shockwaves.push({ x, y, r: 4, maxR: 38, color, alpha: 1 });
}

// =========================================================================
// DISPAROS COM MIRA 360° & BLOQUEIO ANTI-SPAM
// =========================================================================
function getAimAngle(useMouse = true) {
  const directed=arrowAim();
  if(directed!==null)return directed;
  const px = player.x + player.w / 2;
  const py = player.y + 13;
  if (useMouse && mouse.active) {
    return Math.atan2(mouse.y - py, mouse.x - px);
  }
  if (level && level.isBoss && level.boss && level.boss.hp > 0) {
    const bx = level.boss.x + level.boss.w / 2;
    const by = level.boss.y + level.boss.h / 2;
    return Math.atan2(by - py, bx - px);
  }
  return player.facing > 0 ? 0 : Math.PI;
}

function tryPlayerShoot(useMouse = true) {
  if (!level || !level.isBoss || !level.boss || level.boss.hp <= 0) return;
  if (shootCooldown > 0 || deadTimer > 0) return;

  const wep = getActiveWeapon();
  shootCooldown += wep.cooldown;
  weaponRecoil = wep.style === 'cannon' ? 6 : 4;
  muzzleFlashTimer = 4;
  sfxShoot(wep.style);

  const px = player.x + player.w / 2;
  const py = player.y + 13;
  const baseAngle = getAimAngle(useMouse);

  player.facing = Math.cos(baseAngle) >= 0 ? 1 : -1;

  const gunTipX = px + Math.cos(baseAngle) * 18;
  const gunTipY = py + Math.sin(baseAngle) * 18;

  const count = wep.spread || 1;
  const spreadStep = wep.style === 'shotgun' ? 0.14 : 0.08;

  for (let i = 0; i < count; i++) {
    const offsetAngle = (i - (count - 1) / 2) * spreadStep;
    const ang = baseAngle + offsetAngle;
    playerBullets.push({
      x: gunTipX,
      y: gunTipY,
      vx: Math.cos(ang) * wep.speed,
      vy: Math.sin(ang) * wep.speed,
      angle: ang,
      r: wep.style === 'cannon' ? 6 : (wep.style === 'laser' ? 3 : 4),
      damage: wep.damage, weaponId: wep.id, age: 0,
      color: wep.bulletColor,
      style: wep.style,
      homing: (wep.baseId ?? wep.id) === 14
    });
  }
}

function updatePetCompanion() {
  const pet = getActivePet();
  if (!pet || deadTimer > 0) return;

  companion.bobPhase += 0.09;
  const targetX = player.x + (player.facing > 0 ? -18 : player.w + 18);
  const targetY = player.y - 12 + Math.sin(companion.bobPhase) * 4;
  companion.x += (targetX - companion.x) * 0.14;
  companion.y += (targetY - companion.y) * 0.14;
  if (companion.recoil > 0) companion.recoil -= 0.5;

  if (!level || level.training || !level.isBoss || !level.boss || level.boss.hp <= 0) return;

  if (companion.shootTimer > 0) {
    companion.shootTimer--;
    return;
  }

  const b = level.boss;
  let tx = b.x + b.w / 2;
  let ty = b.y + b.h / 2;
  if (b.minions && b.minions.length > 0) {
    let bestDist = 9999;
    for (let m of b.minions) {
      const d = Math.hypot(m.x - companion.x, m.y - companion.y);
      if (d < bestDist) {
        bestDist = d;
        tx = m.x;
        ty = m.y;
      }
    }
  }

  const ang = Math.atan2(ty - companion.y, tx - companion.x);
  companion.shootTimer = pet.cooldown;
  companion.recoil = 3;
  sfxPetShoot();

  petBullets.push({
    x: companion.x,
    y: companion.y,
    vx: Math.cos(ang) * pet.speed,
    vy: Math.sin(ang) * pet.speed,
    r: 3,
    damage: pet.damage,
    color: pet.bulletColor
  });
}

// =========================================================================
// DANO, PARRY, MORTES E VITÓRIA
// =========================================================================
function damagePlayer() {
  if (deadTimer > 0 || enterDoorTimer > 0 || player.invulnTimer > 0) return;

  if (level.isBoss) {
    player.hp--;
    player.invulnTimer = 65;
    shakeTimer = 10;
    sfxPlayerHurt();
    spawnParticles(player.x + 10, player.y + 14, '#e63946', 14, 3.5);
    spawnFloatingText(player.x + 10, player.y - 10, '-1 ❤️', '#ff4d6d');

    if (player.hp <= 0) {
      killPlayer(true);
    }
  } else {
    killPlayer(false);
  }
}

function killPlayer(fromBoss = false) {
  if(level.training){
    Object.assign(player,{x:level.training.checkpoint,y:275,vx:0,vy:0,hp:3,invulnTimer:80,
      jumpBuffer:0,coyoteTimer:0,grounded:false,dashFrames:0,supportTile:null});
    if(level.boss)level.boss.projectiles=[];
    spawnFloatingText(player.x+12,player.y-5,'Tente de novo!','#ffd166');return;
  }
  if (deadTimer > 0) return;
  deadTimer = fromBoss ? 90 : 32;
  diedToBoss = fromBoss;
  deaths++;
  shakeTimer = 14;
  saveAllData();
  updateUI();
  sfxDie();
  spawnParticles(player.x + 10, player.y + 14, getActiveSkin().accent, 22, 4.5);
}

function startDash() {
  if(level?.expedition?.goal===8 && level.expedition.progress===1)return;
  if (screen !== 'playing' || paused || deadTimer || enterDoorTimer || !player.dashReady || player.grounded || player.dashFrames) return;
  player.dashDir = (touchHeld('left') || keys.KeyA || keys.ArrowLeft) ? -1 : (touchHeld('right') || keys.KeyD || keys.ArrowRight) ? 1 : player.facing;
  player.dashReady = false; player.dashFrames = 8;
  passTrainingStep(2);
  player.jumpBuffer = 0; player.coyoteTimer = 0;
  playTone(450, 'sine', 0.09, 0.04, 180);
}
function completeLevel() {
  if(level.training){finishGuide();return;}
  if (enterDoorTimer > 0) return;
  enterDoorTimer = resultFrames;
  sfxWin();

  const diff = getDiffConfig();
  const reward = level.isBoss ? diff.bossReward : diff.normalReward;
  finishStars = rateTime(currentLevel, levelTime / 60);
  stageStars[currentLevel] = Math.max(stageStars[currentLevel] || 0, finishStars);
  gameSave.setItem('solaris_time_stars', JSON.stringify(stageStars));
  const bonus = finishStars === 3 && !claimedBonuses[currentLevel] ? 15 : 0;
  if (bonus) {
    claimedBonuses[currentLevel] = true;
    gameSave.setItem('solaris_v5_petal_medals', JSON.stringify(claimedBonuses));
  }
  sunflowers += reward + bonus;
  const secs = levelTime / 60, bkey = currentLevel + '_' + currentDifficulty;
  const bt = safeJSON('solaris_v5_best', {});
  if (!bt[bkey] || secs < bt[bkey]) {
    const had = !!bt[bkey];
    bt[bkey] = secs;
    try { gameSave.setItem('solaris_v5_best', JSON.stringify(bt)); } catch (e) {}
    if (had) spawnFloatingText(player.x + 10, player.y - 34, 'NOVO RECORDE!', '#70e000');
  }
  spawnFloatingText(player.x + 10, player.y - 16, `+${reward + bonus} 🌻`, '#ffd166');

  if (currentLevel === unlockedLevel && unlockedLevel < TOTAL_LEVELS - 1) {
    unlockedLevel++;
  }
  saveAllData();
  updateUI();
}

function rectIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// =========================================================================
// LÓGICA DOS BOSSES: CHEFE 1 (3 FASES) & CHEFE 2 "MOGGER" (1000 HP, FASE ÚNICA)
// =========================================================================
const CLONE_PALETTES = [
  { main: '#00f5d4', shade: '#00bbf9', highlight: '#ffffff' },
  { main: '#ff007f', shade: '#b5179e', highlight: '#ffccd5' },
  { main: '#70e000', shade: '#38b000', highlight: '#d8f3dc' },
  { main: '#9d4edd', shade: '#5a189a', highlight: '#e0aaff' },
  { main: '#ff5400', shade: '#d00000', highlight: '#ffd166' }
];

function spawnColoredMinions(b, count) {
  for (let i = 0; i < count; i++) {
    const pal = CLONE_PALETTES[(i + Math.floor(Math.random() * 5)) % CLONE_PALETTES.length];
    const startX = 140 + Math.random() * 520;
    b.minions.push({
      x: startX,
      y: 75 + Math.random() * 45,
      vx: (Math.random() > 0.5 ? 1 : -1) * (1.7 + Math.random() * 1.1),
      vy: 0,
      r: 17,
      hp: 8,
      palette: pal,
      type: Math.random() > 0.5 ? 'smile' : 'fangs',
      shootTimer: 70 + Math.floor(Math.random() * 50)
    });
  }
}

function spawnDiagonalLightning(b) {
  const targetX = player.x + 10 + (Math.random() - 0.5) * 90;
  const topX = Math.max(40, Math.min(760, targetX + (Math.random() - 0.5) * 260));
  const botX = Math.max(40, Math.min(760, targetX));
  b.lightnings.push({
    topX, botX,
    warnTimer: 46,
    activeTimer: 14,
    hitDone: false
  });
}

function pointToSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function damageBoss(b, dmg, hitX, hitY, isExplosive = false) {
  if (b.hp <= 0) return;
  const bossDamageScale = b.training||b.chapter === 0 ? 1 : 0.42;
  b.hp -= dmg * bossDamageScale;
  b.hurtTimer = 5;
  sfxBossHit();
  spawnParticles(hitX, hitY, isExplosive ? '#ff9e00' : '#ffd166', isExplosive ? 14 : 6, 3.2);
  if (isExplosive) {
    addShockwave(hitX, hitY, '#ff9e00');
  }

  if (b.hp <= 0) {
    if (!b.singlePhase && b.phase === 1) {
      b.phase = 2;
      b.hp = b.chapter === 0 ? 200 : 600;
      b.maxHp = b.chapter === 0 ? 200 : 600;
      b.state = 'float';
      b.timer = 45;
      shakeTimer = 18;
      addShockwave(b.x + b.w / 2, b.y + b.h / 2, '#ffd166');
      spawnFloatingText(b.x + b.w / 2, b.y - 20, 'VERITY • SORRISO BIZARRO!', '#ff9e00');
      spawnColoredMinions(b, 2);
      return;
    } else if (!b.singlePhase && b.phase === 2) {
      b.phase = 3;
      b.hp = b.chapter === 0 ? 200 : 600;
      b.maxHp = b.chapter === 0 ? 200 : 600;
      b.state = 'abyssal_idle';
      b.timer = 55;
      b.x = 364;
      b.y = 148;
      b.castingTimer = 45;
      shakeTimer = 28;
      addShockwave(400, 180, '#ff0055');
      spawnParticles(400, 180, '#c9b882', 45, 6);
      spawnFloatingText(400, 75, 'VERITY • FORMA MONSTRO!', '#ff0055');
      spawnColoredMinions(b, 3);
      return;
    } else {
      b.hp = 0;
      if(b.training){level.training.phase='exit';level.training.lesson=5;level.expedition.done=true;}
      b.minions = [];
      b.lightnings = [];
      b.projectiles = [];
      b.armPunch.active = false;
      knockoutTimer = 95;
      shakeTimer = 25;
      level.door.open = true;
      addShockwave(b.x + b.w / 2, b.y + b.h / 2, '#ffd166');
      spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#ffd166', 45, 6);
      sfxWin();if(b.training)showTrainingGuide();
    }
  }
}

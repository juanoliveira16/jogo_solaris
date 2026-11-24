const memorySave=new Map();
const gameSave={
  getItem(key){try{return memorySave.has(key)?memorySave.get(key):window.localStorage.getItem(key);}catch{return null;}},
  setItem(key,value){memorySave.set(key,String(value));try{window.localStorage.setItem(key,String(value));}catch{}}
};
const DIFFICULTIES = [
  { id: 'easy', name: 'FÁCIL', color: '#52b788', border: '#95d5b2', normalReward: 5, bossReward: 18, desc1: 'Buracos menores & sem serras', desc2: 'Recompensa básica' },
  { id: 'medium', name: 'MÉDIO', color: '#ffa200', border: '#ffd166', normalReward: 10, bossReward: 35, desc1: 'Novas mecânicas & molas', desc2: 'Recompensa moderada' },
  { id: 'hard', name: 'DIFÍCIL', color: '#e63946', border: '#ff8fa3', normalReward: 20, bossReward: 75, desc1: 'Canhões, chaves & quedas', desc2: 'Boa recompensa' },
  { id: 'impossible', name: 'IMPOSSÍVEL', color: '#b5179e', border: '#ff007f', normalReward: 45, bossReward: 160, desc1: 'Desafio máximo', desc2: 'Recompensa de mestre!' }
];
const savedDifficulty=gameSave.getItem('solaris_campaign_difficulty');
let currentDifficulty=DIFFICULTIES.some(d=>d.id===savedDifficulty)?savedDifficulty:'medium';

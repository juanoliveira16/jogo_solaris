const wardrobe={
  outfit:['Camiseta','Jaqueta','Jardineira','Moletom'],
  pants:['Reta','Bermuda','Cargo'],accessory:['Nenhum','Óculos','Lenço','Flor'],body:['Clássico','Esguio'],leg:['#373a50','#765337','#52664a','#7196ad'],
  cut:['Curto','Cacheado','Longo','Topete','Raspado'],
  cloth:['#477daa','#ca5948','#3e976e','#985fb6','#e6aa46','#363d50'],
  eyes:['#493124','#437c55','#477db5','#785690','#27252a'],
  skin:['#f7d7bd','#e9b18d','#cd976d','#aa714d','#805037','#543528'],
  hair:['#27232b','#67422d','#ae7346','#dfb757','#813a35','#d6caca']
};
let savedLook;try{savedLook=JSON.parse(gameSave.getItem('solaris_avatar_v1'));}catch{}
const stylesByGender={
  Homem:{
    outfit:['Camiseta','Camisa marinheira','Colete de trilha','Camisa polo','Jaqueta de piloto','Moletom','Camisa xadrez','Jardineira','Regata de corrida','Suéter de losangos','Jaqueta','Camisa de oficina','Poncho da serra','Camisa de futebol','Casaco de inverno','Túnica do sino','Camisa de pescador','Camisa universitária','Colete de mensageiro','Capa do vigia'],
    pants:['Reta','Bermuda','Cargo','Jogger','Jeans com barra','Calça de corrida','Pantalona de linho','Calça de oficina','Calça de montaria','Calça xadrez','Bermuda de surf','Calça de goleiro','Calça de alfaiate','Calça de escalada','Calça de jardineiro','Calça de neve','Bermuda de ciclista','Calça do canal','Calça de viajante','Calça de desfile'],
    cut:['Curto','Cacheado','Longo','Topete','Raspado','Degradê','Moicano','Franja lateral','Black power','Coque alto','Mullet','Corte tigela','Ondulado','Dreads curtos','Risca lateral','Espetado','Corte militar','Rabo baixo','Tranças curtas','Undercut'],
    accessory:['Boné','Óculos','Lenço','Flor de lapela','Boina de carteiro','Chapéu de palha','Fone de ouvido','Máscara de trilha','Monóculo','Brinco de argola','Colar de bússola','Gravata','Mochila de lona','Bandana','Coroa do vigia','Cartola','Viseira de corrida','Cachecol comprido','Laço de gala','Bolsinha de cinto']
  },
  Mulher:{
    outfit:['Blusa básica','Blusa listrada','Colete bordado','Blusa de gola laço','Jaqueta curta','Moletom de capuz','Camisa quadriculada','Salopete','Regata nadadora','Pulôver de estrelas','Bolero','Blusa de botões','Pelerine de lã','Camisa de time','Casaco de gola alta','Túnica','Blusa de barqueira','Jaqueta colegial','Colete transpassado','Capa de pétalas'],
    pants:['Calça slim','Short de linho','Cargo de cintura alta','Jogger com laço','Jeans dobrado','Legging esportiva','Pantalona','Calça de artesã','Calça de amazona','Saia plissada','Short de praia','Calça com joelheiras','Calça de pregas','Calça de trekking','Calça do viveiro','Calça acolchoada','Short de ciclismo','Calça de remadora','Calça envelope','Calça de festa'],
    cut:['Pixie','Cachos redondos','Longo em camadas','Franja alta','Corte rente','Bob assimétrico','Crista lateral','Franja cortina','Afro arredondado','Coque','Shag médio','Chanel','Ondas longas','Locs laterais','Risca com presilha','Pontas desfiadas','Curto texturizado','Rabo de cavalo','Trança','Lateral raspada'],
    accessory:['Quepe','Óculos gatinho','Lenço de seda','Flor','Boina francesa','Chapéu de fita','Fone de concha','Máscara bordada','Lente de joalheira','Brinco de gota','Pingente de sol','Fita de gola','Mochila de couro','Faixa trançada','Tiara','Chapéu de copa alta','Viseira de praia','Echarpe','Laço de cabelo','Bolsa a tiracolo']
  }
};
const costumes=[
  ['Base','Cabelo de aprendiz','Regata branca','Short simples','#ede9dc','#59677b'],
  ['Explorador','Cabelo de trilheiro','Túnica de couro','Calças de trilheiro','#a86839','#53685b'],
  ['Cavaleiro','Elmo com chifres','Couraça de ferro','Grevas de ferro','#91a2b1','#677888'],
  ['Mago','Capuz arcano','Manto arcano','Barra do manto','#334880','#303d72'],
  ['Sombra','Elmo de obsidiana','Armadura de obsidiana','Grevas de obsidiana','#393445','#322e40']
];
const pieceColumn={cut:1,outfit:2,pants:3};
// Presets equip entries from the apprentice's own wardrobe.
const presetPieces=[[null,null,null],[0,2,2],[3,4,11],[12,15,6],[19,19,17]];
function uniformPiece(gender,key,index){
  const column=pieceColumn[key],variant=presetPieces[index][column-1];
  return variant===null?costumes[0][column]:stylesByGender[gender][key][variant];
}
function equipCostume(a,i){
  for(const k of Object.keys(pieceColumn))a[k]=uniformPiece(a.gender,k,i);
  Object.assign(a,{cloth:costumes[i][4],leg:costumes[i][5],accessory:'Nenhum'});
}
function pixelPaper(w,h){const el=document.createElement('canvas');el.width=w;el.height=h;return el;}

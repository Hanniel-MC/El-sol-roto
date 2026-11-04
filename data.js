'use strict';
/* ===== DATOS: personajes, mundos, historia, guardado ===== */
const CHARS = [
  { id:'kai', name:'Kai', title:'Aprendiz del Alba', hp:100, spd:1, dmg:1, rate:1, air:0, jump:1, ammo:5, reg:3, unlock:0, weapon:'sword',
    sp:'Corte del Alba', desc:'Equilibrado y fiable. Su especial libera una onda de luz que barre a todos los enemigos cercanos.',
    pal:{ body:'#1d2540', acc:'#ff7a45', skin:'#f0c9a0', blade:'#e8fbff', hair:'#10101a' } },
  { id:'mei', name:'Mei', title:'Sombra del Viento', hp:80, spd:1.22, dmg:0.85, rate:1.3, air:1, jump:1.05, ammo:5, reg:2.6, unlock:3, weapon:'sword',
    sp:'Paso Fantasma', desc:'Muy rápida, con doble salto y ataques veloces. Su especial es un tajo fantasma que atraviesa a los enemigos.',
    pal:{ body:'#2a1836', acc:'#c86bff', skin:'#f4d2b0', blade:'#f1d9ff', hair:'#1d0a2a' } },
  { id:'ryu', name:'Ryu', title:'Muro de Hierro', hp:160, spd:0.85, dmg:1.55, rate:0.72, air:0, jump:0.92, ammo:4, reg:3.5, unlock:6, weapon:'hammer',
    sp:'Terremoto', desc:'Lento pero devastador, con mucha vida. Su especial parte el suelo y lanza ondas de choque.',
    pal:{ body:'#3a2a1a', acc:'#ffc233', skin:'#d9a273', blade:'#cfd8dc', hair:'#1a1008' } },
  { id:'sora', name:'Sora', title:'Cazadora de Estrellas', hp:90, spd:1.08, dmg:0.9, rate:1, air:0, jump:1, ammo:9, reg:1.5, unlock:9, weapon:'sword',
    sp:'Lluvia de Estrellas', desc:'Maestra del shuriken: más munición y recarga rápida. Su especial dispara un abanico de estrellas.',
    pal:{ body:'#12343a', acc:'#35e0c2', skin:'#f1c9a5', blade:'#d6fff6', hair:'#0b1c20' } }
];

const WORLDS = [
  { name:'Bosque de Bambú', sky:['#17334d','#f0a470'], sun:'#ffe0a8', far:'#1f5a57', mid:'#173f40', near:'#0e2b2d', plat:['#3a281a','#5fae4a'], fx:'petal', music:'w0',
    boss:{ name:'Garra', title:'Capitán Bandido', hp:420, dmg:14, spd:95, sc:1.55, atks:['charge','slam'], weapon:'sword',
      pal:{ body:'#4a1f1a', acc:'#e67e22', skin:'#c99a72', blade:'#e0e0e0', hair:'#222', eye:'#ffd54a' } },
    intro:['Mundo 1 · Bosque de Bambú. Los bandidos de Garra acechan entre las cañas. El primer fragmento del Cristal está en su guarida.'],
    outro:['Garra cae derrotado y el primer fragmento del Cristal brilla en tu mano.','Una voz entre los bambúes: «Espera, Kai. Quiero ayudarte». Es Mei, la Sombra del Viento.','¡Nuevo personaje desbloqueado: Mei!'] },
  { name:'Aldea Nocturna', sky:['#0b0f2a','#3b2a63'], sun:'#cfd8ff', far:'#2a2552', mid:'#1c1840', near:'#120f2c', plat:['#2b2140','#7a5cc9'], fx:'firefly', music:'w1',
    boss:{ name:'Hana', title:'Dama Espectro', hp:520, dmg:12, spd:85, sc:1.5, atks:['fan','blink','summon'], weapon:'blade',
      pal:{ body:'#e8e4ff', acc:'#9b6bff', skin:'#f2ecff', blade:'#c8b6ff', hair:'#3a2a6a', eye:'#ff6bd6' } },
    intro:['Mundo 2 · Aldea Nocturna. La aldea duerme bajo una noche sin fin. Hana, la Dama Espectro, controla a los aldeanos con su magia.'],
    outro:['Hana se desvanece como niebla y el segundo fragmento flota hacia ti.','Ryu, el herrero guardián de la aldea, levanta su martillo: «Esta pelea también es mía».','¡Nuevo personaje desbloqueado: Ryu!'] },
  { name:'Cavernas de Cristal', sky:['#071c2b','#1f6f86'], sun:'#9ff3ff', far:'#17566a', mid:'#0f3d4f', near:'#082a38', plat:['#16313d','#5de0e6'], fx:'mote', music:'w2',
    boss:{ name:'Tetsu', title:'Gólem de Cristal', hp:760, dmg:20, spd:70, sc:1.9, atks:['slam','charge','summon'], weapon:'hammer',
      pal:{ body:'#37515c', acc:'#7ff3ff', skin:'#5b7b88', blade:'#bff9ff', hair:'#223640', eye:'#7ff3ff' } },
    intro:['Mundo 3 · Cavernas de Cristal. Bajo la montaña los cristales susurran. El Gólem Tetsu protege el tercer fragmento.'],
    outro:['El gólem se desmorona en mil esquirlas y el tercer fragmento queda a tus pies.','Sora, cazadora de las cavernas, aparece entre las sombras: «Tienes buena puntería... casi tan buena como la mía».','¡Nuevo personaje desbloqueado: Sora!'] },
  { name:'Montañas de Ceniza', sky:['#2a0d0d','#e8602a'], sun:'#ffb36b', far:'#5a1e16', mid:'#3d1411', near:'#260b09', plat:['#2c1512','#e8742a'], fx:'ember', music:'w3',
    boss:{ name:'Ryujin', title:'Dragón de Ceniza', hp:900, dmg:20, spd:95, sc:1.75, atks:['fan','charge','slam','blink'], weapon:'blade',
      pal:{ body:'#5a1a10', acc:'#ff8a2a', skin:'#b4552a', blade:'#ffd08a', hair:'#2a0a06', eye:'#ffe14a' } },
    intro:['Mundo 4 · Montañas de Ceniza. El volcán ruge y el cielo arde. Ryujin, el Dragón de Ceniza, guarda el cuarto fragmento.'],
    outro:['Ryujin se apaga entre brasas. Cuatro fragmentos arden ya en tu cinturón.','Solo falta uno... y está en manos de Kuro, el Señor de las Sombras.'] },
  { name:'Fortaleza Celeste', sky:['#1a1040','#b46bd6'], sun:'#ffd6f5', far:'#4a3a8a', mid:'#33286a', near:'#221a4a', plat:['#2a2250','#c9a0ff'], fx:'cloud', music:'w4',
    boss:{ name:'Kuro', title:'Señor de las Sombras', hp:1300, dmg:24, spd:105, sc:1.7, atks:['fan','charge','slam','blink','summon'], weapon:'blade',
      pal:{ body:'#15101f', acc:'#b14bff', skin:'#3a2a52', blade:'#e0b0ff', hair:'#0a0710', eye:'#ff3b6b' } },
    intro:['Mundo 5 · Fortaleza Celeste. Sobre las nubes se alza el castillo de Kuro. Aquí termina el viaje.'],
    outro:[] }
];

const INTRO = [
  'Hace mil años, el Cristal del Alba mantenía el sol en lo alto del cielo de Aurora y la paz en sus cinco reinos.',
  'Pero una noche, Kuro, el Señor de las Sombras, rompió el cristal en cinco fragmentos. El sol se apagó y el mundo quedó atrapado en un crepúsculo eterno.',
  'Kai, el último aprendiz del Templo del Alba, recibe la espada de su maestro caído: «Recupera los fragmentos... y vuelve a encender el sol».',
  'Así comienza tu viaje, shinobi. Que la luz te guíe.'
];
const ENDING = [
  'Kuro cae. Los cinco fragmentos se alzan al cielo y se unen en un destello cegador.',
  'El Cristal del Alba vuelve a brillar... y el sol sale de nuevo sobre Aurora.',
  'Kai, Mei, Ryu y Sora contemplan el amanecer. La paz ha vuelto, pero toda gran leyenda deja un nuevo comienzo.',
  'FIN. Gracias por jugar, shinobi.'
];

/* ===== Guardado local (funciona sin internet) ===== */
const SKEY = 'albaShinobi_v1';
const defSave = () => ({ best:0, stars:{}, coins:0, sel:'kai', up:{hp:0,dmg:0,en:0,star:0},
  set:{ music:true, sfx:true, vol:0.7, vib:true, diff:1, ctrl:1, q:1, touch:false }, seen:{}, kills:0, deaths:0 });
let Save = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(SKEY)) || {};
    const d = defSave();
    return Object.assign(d, s, { set:Object.assign(d.set, s.set || {}), up:Object.assign(d.up, s.up || {}) });
  } catch (e) { return defSave(); }
})();
const persist = () => { try { localStorage.setItem(SKEY, JSON.stringify(Save)); } catch (e) {} };

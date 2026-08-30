const fs = require('fs');
const path = require('path');
const { parseSermonTextOffline } = require('./local_sermon_parser');
const { buildSermonPptx } = require('./sermon_slide_engine');

const sermonText = `Mateus 6:19-21
19   Não ajunteis tesouros na terra, onde a traça e a ferrugem tudo consomem, e onde os ladrões minam e roubam; 
20   Mas ajuntai tesouros no céu, onde nem a traça nem a ferrugem consomem, e onde os ladrões não minam nem roubam. 
21   Porque onde estiver o vosso tesouro, ali estará também o vosso coração. 
⸻⸻⸻⸻⸻⸻⸻⸺-
Marcos 5:22 
E eis que chegou um dos principais da sinagoga, por nome Jairo, e, vendo-o, prostrou-se aos seus pés e rogava-lhe muito, dizendo: Minha filha está à morte; rogo-te que venhas e lhe imponhas as mãos, para que sare e viva.
E foi com ele; e seguia-o uma grande multidão, que o apertava. E certa mulher, que havia doze anos tinha um fluxo de sangue, e que havia padecido muito com muitos médicos, e despendido tudo quanto tinha, nada lhe aproveitando isso, antes indo a pior...
Marcos 5:24-26
 Quando ela foi curada, Jesus perguntou: "Quem me tocou?". 
E Jairo?
 Esse tempo entre o pedido de socorro ao Senhor Jesus e o milagre é o momento em que muita gente se perde. 
NÃO DEIXE A ANSIEDADE ROUBAR A CONFIANÇA:
Números 23:19
Deus não é homem, para que minta; nem filho do homem, para que se arrependa; porventura diria ele, e não o faria? Ou falaria, e não o confirmaria?
Êxodo 6:9
Deste modo falou Moisés aos filhos de Israel, mas eles não ouviram a Moisés, por causa da angústia de espírito e da dura servidão.
Estando ele ainda falando, chegaram alguns do principal da sinagoga, a quem disseram: A tua filha está morta; para que fatigues mais o Mestre? 
Marcos 5:35
Poucos conseguem manter a fé quando a situação piora.
E Jesus, tendo ouvido estas palavras, disse ao principal da sinagoga: Não temas, crê somente.
Marcos 5:36
FÉ PARA CONFIAR E REAGIR IMEDIATAMENTE AOS PENSAMENTOS E NOTÍCIAS RUINS
E, entrando, disse-lhes: Por que vos alvoroçais e chorais? A menina não está morta, mas dorme.
Marcos 5:39
E riram-se dele. Porém, tendo-os feito sair, tomou consigo o pai e a mãe da menina e os que com ele estavam, e entrou onde ela estava deitada 
Marcos 5:40
E, tomando a mão da menina, disse-lhe: Talitá cumi; que, traduzido, é: Menina, a ti te digo, levanta-te.
Marcos 5:41
Provérbios 3:5-10
5 Confia no SENHOR de todo o teu coração, e não se apóie no teu próprio entendimento. 
9   Honra ao SENHOR com os teus bens, e com a primeira parte de todos os teus ganhos; 
10   E se encherão os teus celeiros, e transbordarão de vinho os teus lagares.`;

const start = Date.now();
const slides = parseSermonTextOffline(sermonText);
const elapsed = Date.now() - start;

console.log(`⚡ Extração 100% Offline concluída em ${elapsed}ms!`);
console.log(`📊 Total de slides identificados: ${slides.length}`);

slides.forEach((s, idx) => {
  console.log(`[Slide ${idx + 1}] (${s.type}) Ref: ${s.reference || 'N/A'}`);
  console.log(`   ${s.runs.map(r => r.highlight ? `[${r.text}]` : r.text).join('')}`);
});

const bgPath = path.join(__dirname, 'public/assets/church_sermon_bg.png');
const outPath = path.join(__dirname, 'downloads/sermao_offline_teste.pptx');

buildSermonPptx(slides, bgPath, outPath).then(() => {
  console.log(`✅ PPTX gerado offline em ${Date.now() - start}ms total!`);
});

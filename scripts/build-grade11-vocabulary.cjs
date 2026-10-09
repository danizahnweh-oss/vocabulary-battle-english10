const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'11/data/source-vocabulary.json'),'utf8'));
const topics={t1:['New York','Aspects of a world city'],t2:['Colonial legacies','South Africa, Canada and the British Empire'],t3:['Structural change','Industrial revolutions and the digital age'],t4:['Postcolonial developments','India, Kenya and perspectives worldwide'],t5:['Global matters','Globalisation, sustainability and language']};
const clean=s=>s.replace(/\s+/g,' ').trim();
const withoutNotes=s=>clean(s.replace(/\([^)]*\)/g,''));
function englishVariants(en){
 const variants=new Set([en,withoutNotes(en)]);
 for(const s of [...variants]){
  for(const part of s.split(/,\s*|\s+\/\s+/))variants.add(part);
  variants.add(s.replace(/sb\/sth/g,'somebody or something').replace(/sth\/sb/g,'something or somebody').replace(/\bsb\b/g,'somebody').replace(/\bsth\b/g,'something'));
  variants.add(s.replace(/sb\/sth|sth\/sb/g,'someone or something').replace(/\bsb\b/g,'someone').replace(/\bsth\b/g,'something'));
  for(const p of ['sb','sth'])variants.add(s.replace(/sb\/sth|sth\/sb/g,p));
  if(s.includes('with/to'))for(const p of ['with','to'])variants.add(s.replace('with/to',p));
 }
 return [...variants].filter(Boolean);
}
function germanVariants(de){
 const variants=new Set();
 for(const s of de.split(';').map(clean)){
  variants.add(s);variants.add(withoutNotes(s));
  for(const version of [s,withoutNotes(s)]){
   // Printed abbreviations: Einwohner/-in, Einheimische/-r, neueste/-r/-s.
   const m=version.match(/^(.*?)\/(?:-)(in|r|e|n|s)(?:\/-[rens])*$/);
   if(m){variants.add(m[1]);for(const suffix of version.slice(m[1].length).split('/').filter(Boolean))variants.add(m[1]+suffix.slice(1));}
   for(const part of version.split(' / '))variants.add(part);
   variants.add(version.replace(/\bjmdn?\.|\bjdn\./g,'jemanden').replace(/\bjmdm\.|\bjdm\./g,'jemandem').replace(/\betw\./g,'etwas'));
  }
 }
 return [...variants].filter(Boolean);
}
const corrections={'Unzufriendenheit':'Unzufriedenheit','Erfolg haben (in/bei(mit)':'Erfolg haben (in/bei/mit)'};
const words=new Map();
for(const r of source){
 let de=r.de;for(const [from,to]of Object.entries(corrections))de=de.replace(from,to);
 const supplemented=!de;if(supplemented){if(r.en!=='bilateral')throw Error('Missing meaning: '+r.en);de='bilateral; zweiseitig';}
 const en=r.en, key=en.toLowerCase();
 let word=words.get(key);
 if(!word){word={id:'g11-'+crypto.createHash('sha256').update(key).digest('hex').slice(0,12),group:r.topic,groups:[],en,de:'',aliases:[],enAliases:englishVariants(en),puzzleEn:withoutNotes(en).split(',')[0],note:'',sources:[]};words.set(key,word);}
 if(!word.groups.includes(r.topic))word.groups.push(r.topic);
 word.de=[...new Set((word.de?word.de.split(';'):[]).concat(de.split(';')).map(clean))].filter(Boolean).join('; ');
 word.aliases=[...new Set(word.aliases.concat(germanVariants(de)))];
 if(supplemented)word.note='The German meaning of “bilateral” was added because the source translation is blank.';
 word.sources.push({file:r.source,row:r.row});
}
const vocab=[...words.values()];
const groups=Object.fromEntries(Object.entries(topics).map(([id,[title]])=>[id,title]));
const missions=Object.entries(topics).map(([id,[title,sub]])=>({id,title,sub,icon:'',groups:[id]}));
const js=`/* Vocabulary extracted from all 65 supplied Green Line Transition sheets.\n   Identical headwords are merged; original topic memberships are retained. */\nconst GRADE=11;\nconst GAME_STYLE='senior';\nconst VOCAB_NOTE='Vocabulary from all five topics. Repeated headwords are combined. One missing German translation was supplemented.';\nconst GROUPS=${JSON.stringify(groups,null,2)};\nconst MISSIONS=${JSON.stringify(missions,null,2)};\nconst VOCAB=${JSON.stringify(vocab,null,2)};\n`;
fs.writeFileSync(path.join(root,'11/vocabulary.js'),js);
console.log(`${source.length} source entries from ${new Set(source.map(x=>x.source)).size} files → ${vocab.length} words. Topic counts: ${missions.map(m=>`${m.id}: ${vocab.filter(w=>w.groups.includes(m.id)).length}`).join(', ')}`);

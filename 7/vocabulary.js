/* Original Unit 1 entries from supplied photos, extended with screenshots (pp. 182–219).
   Each row is one complete headword.
   Extra accepted spellings are kept separately from the printed meanings. */
const GRADE=7;
const VOCAB_NOTE='Units 1–4, Across cultures, Focus and Text smart. Word-bank translations are supplemented where needed.';
const GROUPS={checkin:'Unit 1 · Check-in',station1:'Station 1 · You have to push yourself!',...ADDITIONAL_GROUPS};
const MISSIONS=[
 {id:'unit1',title:'Unit 1 · Find your place',sub:'Check-in, Stations, Skills, Unit task & Story',icon:'🌍',groups:['checkin','station1','unit1']},
 {id:'ac1',title:'Across cultures 1',sub:'Reacting to a new situation',icon:'🥐',groups:['ac1']},
 {id:'focus1',title:'Focus 1',sub:'Young people and media',icon:'📱',groups:['focus1']},
 {id:'unit2',title:'Unit 2 · Let’s go to Wales',sub:'Check-in, Stations, Skills, Unit task, Story & Check-out',icon:'🐉',groups:['unit2']},
 {id:'text1',title:'Text smart 1',sub:'Factual texts',icon:'📰',groups:['text1']},
 {id:'ac2',title:'Across cultures 2',sub:'Making small talk',icon:'💬',groups:['ac2']},
 {id:'unit3',title:'Unit 3 · What was it like?',sub:'Check-in, Stations, Skills, Unit task & Story',icon:'🏰',groups:['unit3']},
 {id:'text2',title:'Text smart 2',sub:'Fictional texts',icon:'📖',groups:['text2']},
 {id:'ac3',title:'Across cultures 3',sub:'Dos and don’ts',icon:'🤝',groups:['ac3']},
 {id:'focus2',title:'Focus 2',sub:'The New World',icon:'⛵',groups:['focus2']},
 {id:'unit4',title:'Unit 4 · In the Desert Southwest',sub:'Check-in, Stations, Skills, Unit task, Story & Check-out',icon:'🌵',groups:['unit4']},
 {id:'wordbanks',title:'Extra word banks',sub:'Word families, media, Wales, history, school & more',icon:'🧩',groups:['extras1','extras2','extras3','extras4']}
];
// English, German, additional English answers, additional German answers, note.
const RAW_VOCAB={
 checkin:[
  ['personality','Persönlichkeit'],
  ['to disagree','anderer Meinung sein; nicht einverstanden sein (mit)',['disagree with'],['nicht einverstanden sein','anderer Meinung sein als'], 'Use “disagree with” before a person or opinion.'],
  ['to compromise','Kompromisse eingehen',[],['einen Kompromiss eingehen']],
  ['smart','schlau; klug; intelligent',['clever']],
  ['self','das Selbst',[],['Selbst'],'The plural of “self” is “selves”.'],
  ['nature','Natur'],
  ['logic','Logik'],
  ['body','Körper'],
  ['saying','Redensart; Sprichwort'],
  ['practice','Training; Übung'],
  ['to judge','beurteilen; bewerten'],
  ['cover','Cover; Titelblatt'],
  ['to matter','von Bedeutung sein; etwas ausmachen',[],['etw. ausmachen','wichtig sein']],
  ["I don’t care",'es ist mir egal',["I do not care"],['mir ist es egal','ist mir egal']],
  ['to be in','in sein; angesagt sein'],
  ['to be out','out sein'],
  ['as long as','solange',[],['so lange wie']],
  ['call-in','Sendung, bei der sich das Publikum telefonisch beteiligen kann',['call in'],['Sendung mit telefonischer Publikumsbeteiligung','Sendung zum Anrufen','Anrufsendung']],
  ['imagination','Fantasie; Vorstellungskraft',[],['Phantasie']],
  ['to compete','konkurrieren (mit); sich messen (mit); in Wettbewerb treten (mit); antreten (gegen)',['compete with','compete against'],['konkurrieren','konkurrieren mit','sich messen','sich messen mit','in Wettbewerb treten','in Wettbewerb treten mit','antreten','antreten gegen'],'Use “compete with” or “compete against” before a rival.'],
  ['themselves','sich selbst (3. Person Plural)',[],['sich selbst']]
 ],
 station1:[
  ['to push oneself','sich alles abverlangen; sich Mühe geben',['push yourself']],
  ['to study','studieren; lernen'],
  ['to enjoy oneself','Spaß haben; sich amüsieren',['enjoy yourself','have a good time']],
  ['waste','Verschwendung'],
  ['to accept','akzeptieren; hinnehmen; annehmen'],
  ['grade','Note; Klasse',[],['Schulnote','Klassenstufe'],'American English: “grade” can mean a school mark or a school year.'],
  ['to make it','es schaffen'],
  ['to complain','sich beschweren; sich beklagen'],
  ['report card','Zeugnis',[],['Schulzeugnis'],'“Report card” is American English.'],
  ['loser','Verlierer / Verliererin; Loser / Loserin'],
  ['to be hard on sb','streng mit jemandem sein; mit jemandem hart ins Gericht gehen',['be hard on somebody','be hard on someone'],['streng mit jmdm. sein','mit jmdm. hart ins Gericht gehen'],'“sb” stands for “somebody”.'],
  ['to relax','sich entspannen; sich ausruhen; sich beruhigen',[],['entspannen','ausruhen','beruhigen']],
  ['laid-back','entspannt; locker',['laid back']],
  ['bossy','herrisch; rechthaberisch'],
  ['rich','reich'],
  ['college','Universität (in den USA)',[],['Universität','Uni'],'In this vocabulary set, “college” refers to a university in the USA.'],
  ['all by oneself','ganz allein',['all by yourself','all alone'],['ganz alleine']],
  ['successful','erfolgreich'],
  ['stubborn','eigensinnig; störrisch'],
  ['to make a decision','eine Entscheidung treffen'],
  ['ambitious','ehrgeizig'],
  ['pushy','aufdringlich; penetrant; aggressiv'],
  ['to react','reagieren'],
  ["in sb’s shoes",'an jemandes Stelle',["in somebody's shoes","in someone's shoes"],['an jmds. Stelle'],'“sb” stands for “somebody”.'],
  ['to criticize','kritisieren',['criticise'],'','“Criticize” is American English; “criticise” is also accepted.'],
  ['to push sb','jemanden drängen',['push somebody','push someone'],['jmdn. drängen'],'“sb” stands for “somebody”.'],
  ['to motivate','motivieren'],
  ['chance','Chance; Gelegenheit; Möglichkeit']
 ]
};
const VOCAB=Object.entries(RAW_VOCAB).flatMap(([group,rows])=>rows.map((r,index)=>({id:`${group}-${index}`,group,en:r[0],de:r[1],enAliases:r[2]||[],aliases:r[3]||[],note:r[4]||''})));
const canonicalKey=value=>value.normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const wordByEnglish=new Map(VOCAB.map(w=>[canonicalKey(w.en),w]));
const nextId={};
for(const added of ADDITIONAL_VOCAB){
 const key=canonicalKey(added.en),existing=wordByEnglish.get(key);
 if(existing){existing.enAliases=[...new Set([...existing.enAliases,...added.enAliases])];existing.aliases=[...new Set([...existing.aliases,...added.aliases,...added.de.split(';').map(s=>s.trim())])];continue;}
 const index=nextId[added.group]||0;nextId[added.group]=index+1;
 const word={...added,id:`${added.group}-${index}`};VOCAB.push(word);wordByEnglish.set(key,word);
}
for(const word of VOCAB){
 // Accept printed abbreviations as well as their full English forms.
 const base=word.en.replace(/\s*\([^)]*\)/g,'').trim();
 if(base!==word.en){word.enAliases.push(base);word.puzzleEn=base;}
 if(/\bsb\b/.test(base))word.enAliases.push(base.replace(/\bsb\b/g,'somebody'),base.replace(/\bsb\b/g,'someone'));
 if(/\bsth\b/.test(base))word.enAliases.push(base.replace(/\bsth\b/g,'something'));
 if(/one[’']s/.test(base))word.enAliases.push(base.replace(/one[’']s/g,'your'));
 word.enAliases=[...new Set(word.enAliases)];
}

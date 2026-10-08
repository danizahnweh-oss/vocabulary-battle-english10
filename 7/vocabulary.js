/* Transcribed from the three supplied Unit 1 photos (pp. 183–185).
   Each row is one complete headword. Cropped Station 2 content is excluded.
   Extra accepted spellings are kept separately from the printed meanings. */
const GRADE=7;
const VOCAB_NOTE='Unit 1: Find your place.';
const GROUPS={checkin:'Unit 1 · Check-in',station1:'Station 1 · You have to push yourself!'};
const MISSIONS=[
  {id:'checkin',title:'Find your place',sub:'Check-in · Personality, opinions & interests',icon:'🌍',groups:['checkin']},
  {id:'station1',title:'You have to push yourself!',sub:'Station 1 · School, ambition & feelings',icon:'🚀',groups:['station1']}
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

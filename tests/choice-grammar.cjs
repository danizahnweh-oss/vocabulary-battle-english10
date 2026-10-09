const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
for(const grade of [7,10,11]){
 const context=vm.createContext({document:{querySelector:()=>null}});
 for(const file of [...(grade===7?['7/vocabulary-additions.js','7/vocabulary.js']:[`${grade}/vocabulary.js`]),'shared/word-types.js'])vm.runInContext(fs.readFileSync(root+'/'+file,'utf8'),context);
 const source=fs.readFileSync(root+'/shared/app.js','utf8');
 vm.runInContext(source.slice(0,source.indexOf('let setup'))+'\n'+source.slice(source.indexOf('function wordInGroups'),source.indexOf('function selectedWords'))+'\n'+source.slice(source.indexOf('const DISTRACTOR_BACKUPS'),source.indexOf('function puzzleAnswer')),context);
 const result=vm.runInContext(`(()=>{
  const failures=[];
  for(const w of VOCAB)for(const lang of ['en','de']){
   const choices=makeChoices(w,lang),correct=choices.filter(c=>c.correct);
   if(choices.length!==4||correct.length!==1||correct[0].word.id!==w.id)failures.push(w.en+' '+lang+': invalid choices');
   if(choices.some(c=>wordType(c.word)!==wordType(w)))failures.push(w.en+' '+lang+': grammar mismatch');
   for(const c of choices.filter(c=>!c.correct))for(const l of ['en','de'])if(answerVariants(w,l).some(a=>answerVariants(c.word,l).includes(a)))failures.push(w.en+': ambiguous answer '+c.word.en);
   if(new Set(choices.map(c=>normalise(c.label))).size!==4)failures.push(w.en+': repeated label');
   const group=w.groups||[w.group];
   const inTopic=VOCAB.filter(v=>wordType(v)===wordType(w)&&v.id!==w.id&&wordInGroups(v,group)&&['en','de'].every(l=>!answerVariants(w,l).some(a=>answerVariants(v,l).includes(a))));
   if(inTopic.length>=12&&choices.some(c=>!wordInGroups(c.word,group)))failures.push(w.en+': topic preference failed');
  }
  return {failures,total:VOCAB.length*2,types:Object.fromEntries(VOCAB.map(w=>[w.en,wordType(w)])),labels:Object.fromEntries(VOCAB.map(w=>[w.en,choiceLabel(w,'de')]))};
 })()`,context);
 assert.deepEqual(Array.from(result.failures),[]);
 const fixtures=grade===7?{smart:'adjective',personality:'noun','to compromise':'verb',mostly:'adverb',themselves:'pronoun',normally:'adverb',fifteen:'numeral',surprise:'noun',opening:'noun',era:'noun'}:grade===10?{similarity:'noun',mutual:'adjective','to simplify':'verb',gentry:'noun'}:{populous:'adjective',particularly:'adverb',transition:'noun',surplus:'noun',intersection:'noun',coastal:'adjective',external:'adjective',once:'conjunction','to thrive':'verb','take to the streets':'verb'};
 for(const [word,pos] of Object.entries(fixtures))assert.equal(result.types[word],pos,word);
 if(grade===7){assert.equal(result.labels.Australian,'australisch');assert.equal(result.labels.Norman,'Normanne / Normannin');assert.equal(result.labels.musical,'musikalisch');}
 if(grade===11)assert.equal(result.labels.native,'einheimisch; eingeboren');
 console.log('PASS grade '+grade+': '+result.total+' complete answer sets, fixed grammar, no duplicate/ambiguous answers, topic preference and linguistic fixtures.');
}

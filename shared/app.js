'use strict';
const $ = s => document.querySelector(s);
const main = $('#main');
const SENIOR = typeof GAME_STYLE !== 'undefined' && GAME_STYLE === 'senior';
const TEAM_ICONS = SENIOR ? ['A','B','C','D'] : ['🚀','🐯','👾','⚡'];
const MODES = {choice:{name:'Quiz',icon:'🎯',hint:'Choose the correct translation.'},type:{name:'Type Attack',icon:'⌨️',hint:'Type one correct translation.'},truth:{name:'True or False',icon:'⚡',hint:'Decide whether the two words match.'},scramble:{name:'Word Scramble',icon:'🧩',hint:'Unscramble the translation and type your answer.'},pairs:{name:'Pair Match',icon:'🔗',hint:'Match each English word to its German meaning.'}};

if(SENIOR){MODES.type.name='Precision Typing';for(const mode of Object.values(MODES))mode.icon='';}

const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = arr => { const copy=[...arr]; for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];} return copy; };
const normalise = value => value.normalize('NFKC').toLowerCase().replace(/ß/g,'ss').replace(/[’‘]/g,"'").replace(/[.,!?;:]/g,'').replace(/\s+/g,' ').trim().replace(/^to /,'');
const EN_ALIAS_WORDS = new Set(VOCAB.flatMap(w=>w.enAliases||[]).map(normalise));
const answerVariants = (word, lang) => {
  if(lang === 'en') return [...new Set([word.en,...word.en.split(' / '),...(word.enAliases||[])].map(normalise))];
  const parts=word.de.split(';').flatMap(s => [s,...s.split(' / ')]);
  return [...new Set([...parts,...word.aliases.filter(s=>!EN_ALIAS_WORDS.has(normalise(s)))].map(normalise))];
};
let setup = {count:2, soloName:'Player 1', names:['Team 1','Team 2','Team 3','Team 4'],topics:MISSIONS.map(m=>m.id),mode:'mix',direction:'mixed',seconds:25,rounds:5,customRounds:true};
let game = null, timer = null;
let feedbackTimer = null, feedbackAdvance = null;
const AUTO_ADVANCE_MS = 1200;
function pauseAutoAdvance(){if(feedbackTimer!==null)clearTimeout(feedbackTimer);feedbackTimer=null;}
function cancelAutoAdvance(){pauseAutoAdvance();feedbackAdvance=null;}
function resumeAutoAdvance(){
  if(!feedbackAdvance||feedbackTimer!==null||document.hidden||document.querySelector('dialog[open]'))return;
  feedbackTimer=setTimeout(()=>{feedbackTimer=null;if(document.hidden||document.querySelector('dialog[open]'))return;const advance=feedbackAdvance;feedbackAdvance=null;advance?.();},AUTO_ADVANCE_MS);
}
function scheduleAutoAdvance(advance){cancelAutoAdvance();feedbackAdvance=advance;resumeAutoAdvance();}
function isSolo(){return setup.count===1;}
function playerNames(){return isSolo()?[setup.soloName]:setup.names.slice(0,setup.count);}
function announce(text){$('#announcer').textContent=text;}
function focusHeading(){const h=main.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
function wordInGroups(word,groups){return (word.groups||[word.group]).some(group=>groups.includes(group));}
function selectedWords(){const groups=MISSIONS.filter(m=>setup.topics.includes(m.id)).flatMap(m=>m.groups);return VOCAB.filter(v=>wordInGroups(v,groups));}
function stopTimer(){cancelAutoAdvance();if(timer){clearInterval(timer);timer=null;}}
function renderSetup(){
  stopTimer();game=null;$('#word-list').disabled=false;
  main.innerHTML=`<div class="intro"><div><h1>${SENIOR?'Vocabulary<br><span>Challenge.</span>':'Level up<br><span>your words.</span>'}</h1><p><strong>English ${GRADE}</strong> · ${SENIOR?'Compete with your class or challenge yourself. Accuracy and speed decide the score.':'Go solo or build your crew. Pick a mission. Rack up XP.'}</p></div><div class="intro-sticker"><span aria-hidden="true">👾</span><b>SOLO +<br>SQUADS</b><span class="sticker-small">Play your way</span></div></div>
  <form id="setup-form"><div class="setup-grid"><div>
  <section class="section" aria-labelledby="teams-title"><div class="section-title"><span class="step" aria-hidden="true">01</span><h2 id="teams-title">${SENIOR?'Players & teams':'Solo or squad?'}</h2></div><div class="team-count" role="group" aria-label="Players and teams">${[1,2,3,4].map(n=>`<button class="choice" type="button" data-count="${n}" aria-pressed="${setup.count===n}">${n===1?'Solo':n+' Teams'}</button>`).join('')}</div><div class="team-inputs ${isSolo()?'solo-input':''}">${Array.from({length:setup.count},(_,i)=>`<div class="team-entry team-color-${i}"><label for="team-${i}"><span class="team-avatar" aria-hidden="true">${TEAM_ICONS[i]}</span> ${isSolo()?'Player name':'Team '+(i+1)}</label><input id="team-${i}" name="team-${i}" maxlength="24" value="${escapeHTML(isSolo()?setup.soloName:setup.names[i])}" autocomplete="off" required></div>`).join('')}</div></section>
  <section class="section" aria-labelledby="topics-title"><div class="section-title"><span class="step" aria-hidden="true">02</span><h2 id="topics-title">${SENIOR?'Choose your topics':'Choose your mission'}</h2></div>
  ${MISSIONS.map(({id,title,sub,icon,groups})=>`<label class="topic topic-${id}"><span class="topic-icon" aria-hidden="true">${icon}</span><input type="checkbox" name="topic" value="${id}" ${setup.topics.includes(id)?'checked':''}><span class="topic-copy"><strong lang="en">${escapeHTML(title)}</strong><span>${escapeHTML(sub)}</span></span><span class="word-count">${VOCAB.filter(w=>wordInGroups(w,groups)).length} words</span></label>`).join('')}
  <p class="hint" id="selection-count"></p><div class="actions"><button type="button" class="secondary" id="flashcards-start">${SENIOR?'':'🃏 '}Flashcards</button>${pendingMistakes.size?'<button type="button" class="quiet" id="mistakes-start">Practise mistakes</button>':''}</div><p class="hint">${flashcardHint()}</p></section>
  </div><aside class="rules" aria-labelledby="rules-title"><h2 id="rules-title"><span aria-hidden="true">🎮</span> Match setup</h2>
  <div class="field"><label for="mode">Game mode</label><select id="mode"><option value="mix">${SENIOR?'Mixed challenge':'Arcade Mix'} · All 5 games</option>${Object.entries(MODES).map(([id,m])=>`<option value="${id}">${m.name}</option>`).join('')}</select><p class="hint" id="mode-description"></p></div>
  <div class="field" id="direction-field"><label for="direction">Translation direction</label><select id="direction"><option value="mixed">Mixed · Both directions</option><option value="de-en">German → English</option><option value="en-de">English → German</option></select></div>
  <div class="field"><label for="seconds">Time per question</label><select id="seconds"><option value="15">15 seconds · Fast</option><option value="25">25 seconds · Standard</option><option value="40">40 seconds · Relaxed</option><option value="0">No time limit</option></select></div>
  <div class="field"><label for="rounds">${isSolo()?'Challenges':'Challenges per team'}</label><select id="rounds"><option value="3">3 · Quick match</option><option value="5">5 · Standard</option><option value="10">10 · Long match</option><option value="custom">Custom · Enter a number</option></select></div><div class="field" id="custom-rounds-field" hidden><label for="custom-rounds">${isSolo()?'Number of questions':'Questions per team'}</label><input id="custom-rounds" type="number" min="1" max="1000" step="1" inputmode="numeric" value="${setup.rounds}" aria-describedby="custom-rounds-hint"><p class="hint" id="custom-rounds-hint">Enter a whole number from 1 to 1000.</p></div>
  <div class="points-preview"><span aria-hidden="true">★</span><div><strong>+100</strong><span>per correct answer</span></div></div><p class="rules-note">Beat the clock for up to 50 bonus XP. Wrong answers never cost you XP.</p>
  <p class="summary-line" id="game-summary"></p><p class="hint error" id="setup-error" role="alert"></p><button type="submit" class="primary full">Start match</button></aside></div></form>`;
  for(const key of ['mode','direction','seconds','rounds']) $(`#${key}`).value=key==='rounds'&&setup.customRounds?'custom':setup[key];
  main.querySelectorAll('[data-count]').forEach(b=>b.addEventListener('click',()=>{readSetup();setup.count=Number(b.dataset.count);renderSetup();main.querySelector(`[data-count="${setup.count}"]`).focus();}));
  $('#setup-form').addEventListener('change',e=>{if(e.target.id==='rounds'&&e.target.value==='custom')$('#custom-rounds').value=setup.rounds;readSetup();updateSetupSummary();});
  $('#custom-rounds').addEventListener('input',()=>{readSetup();updateSetupSummary();});
  $('#setup-form').addEventListener('submit',e=>{e.preventDefault();readSetup();if(!selectedWords().length){$('#setup-error').textContent='Choose at least one mission.';return;}if(new Set(playerNames().map(normalise)).size!==setup.count){$('#setup-error').textContent='Give each team a different name.';return;}startGame();});
  $('#flashcards-start').onclick=()=>{readSetup();startFlashcards(selectedWords());};
  if($('#mistakes-start'))$('#mistakes-start').onclick=()=>{readSetup();startFlashcards(VOCAB.filter(w=>pendingMistakes.has(w.id)));};
  updateSetupSummary();
}
function readSetup(){
  if(isSolo())setup.soloName=$('#team-0').value.trim()||'Player 1';
  else for(let i=0;i<setup.count;i++)setup.names[i]=$(`#team-${i}`).value.trim()||`Team ${i+1}`;
  setup.topics=[...main.querySelectorAll('[name=topic]:checked')].map(x=>x.value);
  for(const key of ['mode','direction']) setup[key]=$(`#${key}`).value;
  setup.seconds=Number($('#seconds').value);
  setup.customRounds=$('#rounds').value==='custom';
  const rounds=Number(setup.customRounds?$('#custom-rounds').value:$('#rounds').value);
  if(Number.isInteger(rounds)&&rounds>=1&&rounds<=1000)setup.rounds=rounds;
}
function updateSetupSummary(){
  $('#selection-count').textContent=`${selectedWords().length} words selected`;
  $('#direction-field').hidden=setup.mode==='pairs';
  $('#custom-rounds-field').hidden=!setup.customRounds;
  $('#custom-rounds').required=setup.customRounds;
  $('#custom-rounds').disabled=!setup.customRounds;
  $('#mode-description').textContent=setup.mode==='mix'?'Quiz, typing, true or false, word scramble and pair match rotate. Runs under 5 questions use as many modes as fit.':MODES[setup.mode].hint;
  $('#game-summary').textContent=`${isSolo()?'Solo':setup.count+' Teams'} · ${setup.count*setup.rounds} challenges in total`;
  $('#setup-error').textContent='';
}
function startGame(pool=selectedWords()){
  stopTimer();
  let deck=[];while(deck.length<setup.count*setup.rounds)deck.push(...shuffle(pool));
  let modes=[];while(modes.length<setup.rounds)modes.push(...(setup.mode==='mix'?shuffle(Object.keys(MODES)):[setup.mode]));
  const firstDirection=Math.random()<.5?'de-en':'en-de';
  const directions=Array.from({length:setup.rounds},(_,i)=>setup.direction==='mixed'?(i%2?(firstDirection==='de-en'?'en-de':'de-en'):firstDirection):setup.direction);
  game={modes,directions,teams:playerNames().map((name,index)=>({name,index,score:0,correct:0})),pool,deck:deck.slice(0,setup.count*setup.rounds),turn:0,phase:'ready',missed:[],current:null,practiceComplete:false};
  $('#word-list').disabled=true;renderReady();
}
function activeTeam(){return game.teams[game.turn%game.teams.length];}
function scoreboard(){return `<div class="scoreboard" aria-label="Scoreboard">${game.teams.map((t,i)=>`<div class="score-team team-color-${i} ${game.turn%game.teams.length===i?'active':''}"><span class="team-avatar" aria-hidden="true">${TEAM_ICONS[i]}</span><div class="score-copy"><small>${escapeHTML(t.name)}${game.turn%game.teams.length===i?`<span class="turn-tag">${isSolo()?'Your run':'Your turn'}</span>`:''}</small><strong>${t.score} <span class="points-label">XP</span></strong><div class="hit-track" role="img" aria-label="${t.correct} of ${setup.rounds} correct">${setup.rounds>10?`${t.correct} / ${setup.rounds}`:Array.from({length:setup.rounds},(_,n)=>`<span class="${n<t.correct?'hit':''}" aria-hidden="true">${n<t.correct?'★':'·'}</span>`).join('')}</div></div></div>`).join('')}</div>`;}
function roundIndicators(round){
  const start=setup.rounds>10?Math.max(0,Math.min(round-2,setup.rounds-5)):0;
  const count=Math.min(setup.rounds,setup.rounds>10?5:10);
  return (start?'<span>…</span>':'')+Array.from({length:count},(_,n)=>{const i=start+n;return `<span class="${i<round?'done':i===round?'current':''}">${i<round?'✓':i+1}</span>`;}).join('')+(start+count<setup.rounds?'<span>…</span>':'');
}
function gameFrame(){const round=Math.floor(game.turn/game.teams.length);return `<div class="game-top"><div><strong>${SENIOR?'Round':'Level'} ${round+1} / ${setup.rounds}</strong><p>Challenge ${game.turn+1} of ${game.deck.length}</p></div><div class="round-track" aria-hidden="true">${roundIndicators(round)}<span class="finish-flag">🏁</span></div><button id="quit" class="quiet">End match</button></div>${scoreboard()}<section class="arena" id="arena"></section>`;}
function bindQuit(){$('#quit').addEventListener('click',()=>{pauseAutoAdvance();$('#quit-dialog').showModal();});}
function renderReady(){
  game.phase='ready';main.innerHTML=gameFrame();bindQuit();
  $('#arena').innerHTML=`<div class="ready team-color-${game.turn%game.teams.length}"><div class="ready-avatar" aria-hidden="true">${TEAM_ICONS[game.turn%game.teams.length]}</div><span class="ready-round">${isSolo()?(SENIOR?'Solo challenge':'Your solo mission'):(SENIOR?'Next team':'Next crew up')}</span><h1 class="ready-team">${escapeHTML(activeTeam().name)}</h1><p>${setup.seconds?`You have ${setup.seconds} seconds once the question starts.`:'Take your time to find the answer.'} ${isSolo()?'Trust your instincts and collect as much XP as you can.':'Talk it over and submit one answer together.'}</p><button id="begin-question" class="primary">${SENIOR?'Start challenge':'Start mission'}</button><p class="hint" style="margin-top:24px">${setup.mode==='mix'?(SENIOR?'Mixed challenge · All 5 games':'Arcade Mix · All 5 games'):MODES[setup.mode].name} · ${setup.direction==='mixed'?'Both translation directions':setup.direction==='de-en'?'German → English':'English → German'}</p></div>`;
  $('#begin-question').addEventListener('click',renderQuestion);focusHeading();
}
// Rare word classes have a small, checked backup bank for answer options only.
// These words never enter the question deck or change the selected vocabulary.
const DISTRACTOR_BACKUPS={
 conjunction:[['although','obwohl'],['unless','wenn nicht; es sei denn'],['because','weil'],['while','während']],
 numeral:[['three','drei'],['seven','sieben'],['twelve','zwölf'],['twenty','zwanzig']],
 determiner:[['every','jeder; jede; jedes'],['many','viele'],['enough','genug'],['no','kein; keine']],
 pronoun:[['everyone','jeder; alle'],['herself','sich selbst (weiblich)'],['nothing','nichts'],['someone','jemand']]
};
function wordType(word){return word.pos||WORD_TYPES[GRADE][word.id]?.[0];}
function choiceLabel(word,lang){return lang==='de'?(WORD_TYPES[GRADE][word.id]?.[1]||word.de):word.en;}
function makeChoices(word,lang){
  const accepted=new Set(answerVariants(word,lang));
  const equivalent=new Set(answerVariants(word,lang==='en'?'de':'en'));
  const pos=wordType(word),groups=word.groups||[word.group];
  const related=[...new Set([...groups,...MISSIONS.filter(m=>m.groups.some(g=>groups.includes(g))).flatMap(m=>m.groups)])];
  const eligible=v=>v.id!==word.id&&wordType(v)===pos&&!answerVariants(v,lang).some(a=>accepted.has(a))&&!answerVariants(v,lang==='en'?'de':'en').some(a=>equivalent.has(a));
  // Keep the grammar fixed, then favour the same topic and similar label lengths.
  const score=v=>(wordInGroups(v,groups)?8:wordInGroups(v,related)?4:0)-Math.abs(Math.log((choiceLabel(v,lang).length+1)/(choiceLabel(word,lang).length+1)));
  const candidates=shuffle(VOCAB.filter(eligible)).sort((a,b)=>score(b)-score(a));
  const topic=candidates.filter(v=>wordInGroups(v,groups)),nearby=candidates.filter(v=>!wordInGroups(v,groups)&&wordInGroups(v,related)),other=candidates.filter(v=>!wordInGroups(v,related));
  const ranked=[...shuffle(topic.slice(0,12)),...topic.slice(12),...shuffle(nearby.slice(0,12)),...nearby.slice(12),...shuffle(other.slice(0,12)),...other.slice(12)];
  const backups=(DISTRACTOR_BACKUPS[pos]||[]).map(([en,de],i)=>({id:`option-${pos}-${i}`,en,de,pos,aliases:[],enAliases:[],group:''})).filter(eligible);
  const choices=[{word,correct:true,label:choiceLabel(word,lang)}],labels=new Set([normalise(choiceLabel(word,lang))]);
  // Distractors must also be distinct from each other, including alternative senses.
  const chosen=[word];
  for(const v of [...ranked,...shuffle(backups)]){
    const label=choiceLabel(v,lang);
    if(labels.has(normalise(label))||chosen.some(w=>answerVariants(w,lang).some(a=>answerVariants(v,lang).includes(a))))continue;
    choices.push({word:v,correct:false,label});chosen.push(v);labels.add(normalise(label));
    if(choices.length===4)break;
  }
  return shuffle(choices);
}
function puzzleAnswer(word,lang){
  if(lang==='en')return word.puzzleEn||(word.en==='(song) lyrics'?'song lyrics':word.en.split(' / ')[0]).replace(/^to /,'');
  return word.de.split(';')[0].split(' / ')[0].replace(/\s*\([^)]*\)/g,'').trim();
}
function scrambleText(text){
  const parts=text.length>60?text.split(' '):Array.from(text);
  let mixed=shuffle(parts);if(mixed.join('')===parts.join(''))mixed=[...parts.slice(1),parts[0]];
  return mixed.join(text.length>60?' · ':' ');
}
function matchWords(word,pool){
  const picked=[word];
  for(const v of shuffle(pool)){
    if(picked.every(w=>w.id!==v.id&&['en','de'].every(lang=>!answerVariants(w,lang).some(a=>answerVariants(v,lang).includes(a)))))picked.push(v);
    if(picked.length===3)break;
  }
  return picked;
}
function renderQuestion(){
  stopTimer();
  const word=game.deck[game.turn],round=Math.floor(game.turn/game.teams.length);
  const mode=game.modes[round],direction=game.directions[round];
  const target=direction==='de-en'?'en':'de',prompt=direction==='de-en'?'de':'en';
  const c=game.current={word,mode,target,prompt,choices:makeChoices(word,target),deadline:0};
  if(mode==='truth'){c.truth=Math.random()<.5;c.shown=c.truth?word:shuffle(c.choices.filter(x=>!x.correct))[0].word;}
  if(mode==='pairs'){c.pairs=matchWords(word,game.pool);c.matched=[];c.selected=null;}
  if(mode==='scramble')c.puzzle=puzzleAnswer(word,target);
  game.phase='question';main.innerHTML=gameFrame();bindQuit();
  const language=target==='en'?'English':'German';
  let content='';
  if(mode==='choice')content=`<div class="answers">${c.choices.map((choice,i)=>`<button class="answer" data-answer="${i}"><span class="key" aria-hidden="true">${i+1}</span><span lang="${target}">${escapeHTML(choice.label)}</span></button>`).join('')}</div>`;
  if(mode==='truth')content=`<div class="translation-candidate" lang="${target}">${escapeHTML(c.shown[target])}</div><div class="answers truth-answers"><button class="answer" data-truth="true"><span aria-hidden="true">✓</span> True</button><button class="answer" data-truth="false"><span aria-hidden="true">×</span> False</button></div>`;
  if(mode==='type'||mode==='scramble')content=`${mode==='scramble'?`<div class="scramble-board"><span class="hint">Decode this ${language} translation</span><p class="scrambled-letters" lang="${target}">${escapeHTML(scrambleText(c.puzzle))}</p></div>`:''}<form id="answer-form"><label for="typed-answer">Your answer in ${language}</label><div class="typing-row"><input class="typed-input" id="typed-answer" autocomplete="off" autocapitalize="none" spellcheck="false" lang="${target}" placeholder="${language} translation" required><button class="primary" type="submit">Check answer</button></div><p class="hint">One correct translation is enough.${target==='en'?' “to” is optional for verbs.':''}</p></form>`;
  if(mode==='pairs')content=`<p class="pair-instructions">Select a word, then its match in the other column. Complete all ${c.pairs.length} ${c.pairs.length===1?'pair':'pairs'} to earn XP. A wrong pair ends this challenge.</p><p class="pair-progress" id="pair-progress" role="status">0 / ${c.pairs.length} matched</p><div class="pair-board">${['en','de'].map(lang=>`<div class="pair-column"><h2>${lang==='en'?'English':'German'}</h2>${shuffle(c.pairs).map(w=>`<button class="pair-tile" data-pair="${w.id}" data-lang="${lang}" aria-pressed="false"><span lang="${lang}">${escapeHTML(w[lang])}</span><span class="pair-mark" aria-hidden="true"></span></button>`).join('')}</div>`).join('')}</div>`;
  $('#arena').innerHTML=`<div class="question-meta"><div><span class="mode-badge"><span aria-hidden="true">${MODES[mode].icon}</span> ${MODES[mode].name}</span><p class="direction">${MODES[mode].hint}<br><span>${mode==='pairs'?'English ↔ German':direction==='de-en'?'German → English':'English → German'}</span></p></div><div class="timer-box"><span class="timer-label" aria-hidden="true">⏱ Your time</span><div class="timer" id="timer" role="timer" aria-label="Time remaining">${setup.seconds?setup.seconds+' s':'No limit'}</div>${setup.seconds?'<div class="timer-track" aria-hidden="true"><div class="timer-fill" id="timer-fill"></div></div>':''}</div></div>
  <h1 class="question-title ${mode!=='pairs'&&word[prompt].length>65?'long':''}" ${mode==='pairs'?'':`lang="${prompt}"`}>${mode==='pairs'?'Link the words!':escapeHTML(word[prompt])}</h1>${content}<div id="feedback-slot"></div><p class="keyboard-hint">${mode==='choice'?'Keyboard: press 1, 2, 3 or 4 to answer.':mode==='type'||mode==='scramble'?'Press Enter to submit your answer.':'Use Tab to choose a button, then press Enter.'}</p>`;
  if(mode==='choice')main.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>submitAnswer(Number(b.dataset.answer))));
  else if(mode==='truth')main.querySelectorAll('[data-truth]').forEach(b=>b.addEventListener('click',()=>submitAnswer(b.dataset.truth==='true')));
  else if(mode==='pairs')main.querySelectorAll('[data-pair]').forEach(b=>b.addEventListener('click',()=>selectPair(b)));
  else $('#answer-form').addEventListener('submit',e=>{e.preventDefault();if($('#typed-answer').value.trim())submitAnswer($('#typed-answer').value);});
  if(mode==='type'||mode==='scramble')$('#typed-answer').focus();else focusHeading();
  c.deadline=performance.now()+setup.seconds*1000;
  if(setup.seconds)timer=setInterval(tick,100);
}
function selectPair(button){
  if(game.phase!=='question')return;
  const c=game.current;
  if(setup.seconds&&performance.now()>=c.deadline){submitAnswer(null);return;}
  const previous=c.selected;
  if(previous===button){button.setAttribute('aria-pressed','false');c.selected=null;return;}
  if(!previous||previous.dataset.lang===button.dataset.lang){
    previous?.setAttribute('aria-pressed','false');c.selected=button;button.setAttribute('aria-pressed','true');return;
  }
  if(previous.dataset.pair!==button.dataset.pair){previous.classList.add('pair-wrong');button.classList.add('pair-wrong');submitAnswer(false);return;}
  c.matched.push(button.dataset.pair);c.selected=null;
  for(const b of [previous,button]){b.disabled=true;b.setAttribute('aria-pressed','false');b.classList.add('pair-matched');b.querySelector('.pair-mark').textContent='✓';}
  $('#pair-progress').textContent=`${c.matched.length} / ${c.pairs.length} matched`;
  if(c.matched.length===c.pairs.length)submitAnswer(true);
  else main.querySelector('.pair-tile:not(:disabled)').focus({preventScroll:true});
}

function tick(){
  if(!game||game.phase!=='question'){stopTimer();return;}
  const remaining=Math.max(0,game.current.deadline-performance.now());
  $('#timer').textContent=`${Math.ceil(remaining/1000)} s`;$('#timer-fill').style.transform=`scaleX(${remaining/(setup.seconds*1000)})`;
  $('#timer').classList.toggle('urgent',remaining<=5000);
  if(remaining<=5000&&!game.current.announced){game.current.announced=true;announce('Five seconds left.');}
  if(remaining<=0)submitAnswer(null);
}
function submitAnswer(value){
  if(!game||game.phase!=='question')return;
  const c=game.current;const remaining=setup.seconds?Math.max(0,c.deadline-performance.now()):0;
  const timedOut=setup.seconds>0&&remaining<=0;
  if(timedOut)value=null;
  stopTimer();game.phase='feedback';
  const correct=value!==null&&(c.mode==='choice'?c.choices[value]?.correct:c.mode==='truth'?value===c.truth:c.mode==='pairs'?value===true:answerVariants(c.word,c.target).includes(normalise(value))||(c.mode==='scramble'&&normalise(value)===normalise(c.puzzle)));
  const bonus=correct&&setup.seconds?Math.min(50,Math.ceil(50*remaining/(setup.seconds*1000))):0;
  if(correct){activeTeam().score+=100+bonus;activeTeam().correct++;}else {const missed=c.mode==='pairs'?c.pairs.filter(w=>!c.matched.includes(w.id)):[c.word];game.missed.push(...missed);rememberMistakes(missed);}
  if(c.mode==='choice')main.querySelectorAll('[data-answer]').forEach(b=>{b.disabled=true;const index=Number(b.dataset.answer);if(c.choices[index].correct){b.classList.add('correct');b.querySelector('.key').textContent='✓';}else if(index===value){b.classList.add('wrong');b.querySelector('.key').textContent='×';}});
  else if(c.mode==='truth')main.querySelectorAll('[data-truth]').forEach(b=>{b.disabled=true;b.classList.add((b.dataset.truth==='true')===c.truth?'correct':'wrong');});
  else if(c.mode==='pairs')main.querySelectorAll('[data-pair]').forEach(b=>b.disabled=true);
  else {$('#typed-answer').disabled=true;$('#answer-form button').disabled=true;}
  main.querySelector('.scoreboard').outerHTML=scoreboard();
  const heading=correct?`Correct! +${100+bonus} XP`:timedOut?'Time is up.':'Not quite. Learn this one!';
  $('#feedback-slot').innerHTML=`<div class="feedback ${correct?'':'fail'}"><span class="feedback-icon" aria-hidden="true">${correct?'🌟':timedOut?'⏰':'💡'}</span><div class="feedback-copy"><h3>${heading}</h3><p><span lang="en">${escapeHTML(c.word.en)}</span> = <span lang="de">${escapeHTML(c.word.de)}</span></p>${correct&&bonus?`<p class="hint">100 XP + ${bonus} speed bonus</p>`:''}${c.mode==='pairs'?c.pairs.filter(w=>w.id!==c.word.id).map(w=>`<p><span lang="en">${escapeHTML(w.en)}</span> = <span lang="de">${escapeHTML(w.de)}</span></p>`).join(''):''}${c.word.note?`<p class="hint">${escapeHTML(c.word.note)}</p>`:''}${correct?'<p class="hint">Continuing automatically.</p>':''}</div><button class="primary" id="next">${game.turn+1===game.deck.length?'View results':isSolo()?'Next question':'Next team'}</button></div>`;
  $('#announcer').innerHTML=`${escapeHTML(heading)} <span lang="en">${escapeHTML(c.word.en)}</span>: <span lang="de">${escapeHTML(c.word.de)}</span>`;
  if(correct)celebrate();
  const match=game;
  const advance=()=>{if(game!==match||game.phase!=='feedback'||game.current!==c)return;cancelAutoAdvance();game.turn++;if(game.turn>=game.deck.length)renderResults();else if(isSolo())renderQuestion();else renderReady();};
  $('#next').addEventListener('click',advance);
  if(correct)scheduleAutoAdvance(advance);
  $('#next').focus({preventScroll:true});
}
function renderResults(){
  if(game.missed.length&&!game.practiceComplete){startFlashcards(game.missed,true);return;}
  stopTimer();game.phase='results';$('#word-list').disabled=false;
  const sorted=[...game.teams].sort((a,b)=>b.score-a.score);const top=sorted[0].score;
  const winners=sorted.filter(t=>t.score===top);const missed=[...new Map(game.missed.map(w=>[w.id,w])).values()];
  const title=isSolo()?(top===0?'New run, fresh start!':sorted[0].correct===setup.rounds?'Mission mastered!':'Mission complete!'):top===0?'New round, fresh start!':winners.length>1?'A tie at the top!':`${escapeHTML(winners[0].name)} wins!`;
  main.innerHTML=`<div class="results-heading"><div class="trophy" aria-hidden="true">${top>0?'🏆':'💪'}</div><span class="tag">${isSolo()?'Solo run complete':'Match complete'}</span><h1>${title}</h1><p>${top===0?'Review the words and jump into a new round.':isSolo()?'Your mission. Your XP. Ready for another run?':winners.length>1?winners.map(t=>escapeHTML(t.name)).join(' & ')+` share the win with ${top} XP.`:'Well played. Here are your results.'}</p></div>
  <div class="ranking">${sorted.map((t,i)=>`<div class="ranking-row team-color-${t.index} ${t.score===top&&top>0?'winner':''}">${isSolo()?'':`<span class="rank">${sorted.findIndex(x=>x.score===t.score)+1}</span>`}<span class="team-avatar" aria-hidden="true">${TEAM_ICONS[t.index]}</span><div class="rank-name"><strong>${escapeHTML(t.name)}</strong><p>${t.correct} of ${setup.rounds} correct</p></div><span class="rank-points">${t.score} <span style="font-size:.875rem;font-weight:400">XP</span></span></div>`).join('')}</div>
  <div class="actions result-actions"><button class="primary" id="play-again">${isSolo()?'Play again':'Play a rematch'}</button>${missed.length?'<button class="secondary" id="retry-missed">Retry tricky words</button>':''}<button class="quiet" id="new-game">${isSolo()?'Change setup':'Change teams & rules'}</button></div>
  ${missed.length?`<details class="review"><summary>Review ${missed.length} tricky ${missed.length===1?'word':'words'}</summary>${missed.map(w=>`<div class="review-row"><span lang="en">${escapeHTML(w.en)}</span><span lang="de">${escapeHTML(w.de)}</span></div>`).join('')}</details>`:`<p class="hint" style="text-align:center;margin-top:32px">Every answer correct. ${isSolo()?'Perfect run!':'Perfect teamwork!'}</p>`}`;
  $('#play-again').addEventListener('click',()=>startGame(game.pool));
  $('#new-game').addEventListener('click',()=>{renderSetup();focusHeading();});
  if(missed.length)$('#retry-missed').addEventListener('click',()=>startGame(missed));
  focusHeading();
  if(top>0)celebrate();
}
function celebrate(){
  if(SENIOR||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelector('.celebration')?.remove();
  const burst=document.createElement('div');burst.className='celebration';burst.setAttribute('aria-hidden','true');
  burst.innerHTML=Array.from({length:20},(_,i)=>`<span style="--x:${5+(i*37)%90}%;--delay:${i%5*45}ms;--spin:${i%2?240:-180}deg;--drift:${i%2?60:-60}px" class="confetti confetti-${i%4}"></span>`).join('');
  document.body.append(burst);setTimeout(()=>burst.remove(),1100);
}
function renderWords(){const query=normalise($('#word-search').value);const words=VOCAB.filter(w=>normalise(w.en+' '+w.de).includes(query));$('#words-content').innerHTML=words.length?Object.entries(GROUPS).map(([key,name])=>{const list=words.filter(w=>wordInGroups(w,[key]));return list.length?`<h3>${name} <span style="font-weight:400">(${list.length})</span></h3>${list.map(w=>`<div class="review-row"><span lang="en">${escapeHTML(w.en)}</span><span lang="de">${escapeHTML(w.de)}</span></div>`).join('')}`:'';}).join(''):'<p>No words found. Try a different search.</p>';}
$('#word-list').addEventListener('click',()=>{renderWords();$('#words-dialog').showModal();});
$('#close-words').addEventListener('click',()=>$('#words-dialog').close());
$('#word-search').addEventListener('input',renderWords);
$('#keep-playing').addEventListener('click',()=>{$('#quit-dialog').close();resumeAutoAdvance();});
$('#quit-dialog').addEventListener('close',resumeAutoAdvance);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAutoAdvance();else resumeAutoAdvance();});
$('#confirm-quit').addEventListener('click',()=>{$('#quit-dialog').close();renderSetup();focusHeading();});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{announce('Full screen is not available in this browser.');$('#fullscreen').textContent='Full screen unavailable';}});
if(!document.documentElement.requestFullscreen)$('#fullscreen').hidden=true;
document.addEventListener('fullscreenchange',()=>{$('#fullscreen').textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
document.addEventListener('invalid',e=>{if(e.target.matches('input[required]'))e.target.setCustomValidity(e.target.id==='custom-rounds'?'Enter a whole number from 1 to 1000.':['typed-answer','card-answer'].includes(e.target.id)?'Enter a translation.':isSolo()?'Enter your player name.':'Enter a team name.');},true);
document.addEventListener('input',e=>{if(e.target.matches('input[required]'))e.target.setCustomValidity('');});
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(game?.phase==='question'&&game.current.mode==='choice'&&/^[1-4]$/.test(e.key)){e.preventDefault();submitAnswer(Number(e.key)-1);}});
$('#vocab-total').textContent=`${VOCAB.length} words · ${Object.keys(MODES).length} game modes`;
$('#word-log-intro').textContent=`All ${VOCAB.length} words for English ${GRADE}. ${VOCAB_NOTE}`;
loadMistakes();
renderSetup();

'use strict';
const $ = s => document.querySelector(s);
const main = $('#main');
const TEAM_ICONS = ['🚀','🐯','👾','⚡'];
const MODES = {choice:{name:'Quiz',icon:'🎯',hint:'Choose the correct translation.'},type:{name:'Type Attack',icon:'⌨️',hint:'Type one correct translation.'},truth:{name:'True or False',icon:'⚡',hint:'Decide whether the two words match.'},scramble:{name:'Word Scramble',icon:'🧩',hint:'Unscramble the translation and type your answer.'},pairs:{name:'Pair Match',icon:'🔗',hint:'Match each English word to its German meaning.'}};
const TOPIC_ICONS = {cultures:'🌍',scotland:'🏰',history:'⏳'};
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = arr => { const copy=[...arr]; for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];} return copy; };
const normalise = value => value.normalize('NFKC').toLowerCase().replace(/ß/g,'ss').replace(/[’‘]/g,"'").replace(/[.,!?;:]/g,'').replace(/\s+/g,' ').trim().replace(/^to /,'');
const EN_ALIASES = {
  'cultures-7':['useful','helpful'], 'cultures-8':['declare'],
  'cultures-10':['lyrics','song lyrics'], 'time-0':['age','era','period'],
  'time-1':['age of enlightenment'], 'time-2':['elizabethan age'], 'time-3':['victorian age'], 'time-4':['middle ages'],
  'relations-1':['descent'], 'relations-7':['ancestry'],
  'development-2':['evolve'], 'development-4':['develop'],
  'aggression-15':['revolt'], 'aggression-17':['rebel'],
  'relations-9':['hand down','hand sth down','hand something down'],
  'development-5':['found','establish'], 'systems-7':['colonize'], 'systems-8':['colonization'],
  'systems-9':['feudal system'], 'systems-13':['lord','lady'], 'aggression-18':['revolutionize']
};
const EN_ALIAS_WORDS = new Set(Object.values(EN_ALIASES).flat().map(normalise));
const answerVariants = (word, lang) => {
  if(lang === 'en') return [...new Set([word.en,...word.en.split(' / '),...(EN_ALIASES[word.id]||[])].map(normalise))];
  const parts=word.de.split(';').flatMap(s => [s,...s.split(' / ')]);
  return [...new Set([...parts,...word.aliases.filter(s=>!EN_ALIAS_WORDS.has(normalise(s)))].map(normalise))];
};
let setup = {count:2, soloName:'Player 1', names:['Team 1','Team 2','Team 3','Team 4'],topics:['cultures','scotland','history'],mode:'mix',direction:'mixed',seconds:25,rounds:5};
let game = null, timer = null;
function isSolo(){return setup.count===1;}
function playerNames(){return isSolo()?[setup.soloName]:setup.names.slice(0,setup.count);}
function announce(text){$('#announcer').textContent=text;}
function focusHeading(){const h=main.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
function selectedWords(){return VOCAB.filter(v=>setup.topics.includes(v.group)||setup.topics.includes('history')&&!['cultures','scotland'].includes(v.group));}
function stopTimer(){if(timer){clearInterval(timer);timer=null;}}
function renderSetup(){
  stopTimer();game=null;$('#word-list').disabled=false;
  main.innerHTML=`<div class="intro"><div><h1>Level up<br><span>your words.</span></h1><p>Go solo or build your crew. Pick a mission. Rack up XP.</p></div><div class="intro-sticker"><span aria-hidden="true">👾</span><b>SOLO +<br>SQUADS</b><span class="sticker-small">Play your way</span></div></div>
  <form id="setup-form"><div class="setup-grid"><div>
  <section class="section" aria-labelledby="teams-title"><div class="section-title"><span class="step" aria-hidden="true">01</span><h2 id="teams-title">Solo or squad?</h2></div><div class="team-count" role="group" aria-label="Players and teams">${[1,2,3,4].map(n=>`<button class="choice" type="button" data-count="${n}" aria-pressed="${setup.count===n}">${n===1?'Solo':n+' Teams'}</button>`).join('')}</div><div class="team-inputs ${isSolo()?'solo-input':''}">${Array.from({length:setup.count},(_,i)=>`<div class="team-entry team-color-${i}"><label for="team-${i}"><span class="team-avatar" aria-hidden="true">${TEAM_ICONS[i]}</span> ${isSolo()?'Player name':'Team '+(i+1)}</label><input id="team-${i}" name="team-${i}" maxlength="24" value="${escapeHTML(isSolo()?setup.soloName:setup.names[i])}" autocomplete="off" required></div>`).join('')}</div></section>
  <section class="section" aria-labelledby="topics-title"><div class="section-title"><span class="step" aria-hidden="true">02</span><h2 id="topics-title">Choose your mission</h2></div>
  ${[['cultures','Across cultures','Same same but different?',11],['scotland','Scottish history','From “bravery” to “enlightenment”',18],['history','History words','Time, relations, development, systems & aggression',VOCAB.length-29]].map(([id,title,sub,count])=>`<label class="topic topic-${id}"><span class="topic-icon" aria-hidden="true">${TOPIC_ICONS[id]}</span><input type="checkbox" name="topic" value="${id}" ${setup.topics.includes(id)?'checked':''}><span class="topic-copy"><strong lang="en">${title}</strong><span>${sub}</span></span><span class="word-count">${count} words</span></label>`).join('')}
  <p class="hint" id="selection-count"></p></section>
  </div><aside class="rules" aria-labelledby="rules-title"><h2 id="rules-title"><span aria-hidden="true">🎮</span> Match setup</h2>
  <div class="field"><label for="mode">Game mode</label><select id="mode"><option value="mix">Arcade Mix · All 5 games</option>${Object.entries(MODES).map(([id,m])=>`<option value="${id}">${m.name}</option>`).join('')}</select><p class="hint" id="mode-description"></p></div>
  <div class="field" id="direction-field"><label for="direction">Translation direction</label><select id="direction"><option value="mixed">Mixed · Both directions</option><option value="de-en">German → English</option><option value="en-de">English → German</option></select></div>
  <div class="field"><label for="seconds">Time per question</label><select id="seconds"><option value="15">15 seconds · Fast</option><option value="25">25 seconds · Standard</option><option value="40">40 seconds · Relaxed</option><option value="0">No time limit</option></select></div>
  <div class="field"><label for="rounds">${isSolo()?'Challenges':'Challenges per team'}</label><select id="rounds"><option value="3">3 · Quick match</option><option value="5">5 · Standard</option><option value="10">10 · Long match</option></select></div>
  <div class="points-preview"><span aria-hidden="true">★</span><div><strong>+100</strong><span>per correct answer</span></div></div><p class="rules-note">Beat the clock for up to 50 bonus XP. Wrong answers never cost you XP.</p>
  <p class="summary-line" id="game-summary"></p><p class="hint error" id="setup-error" role="alert"></p><button type="submit" class="primary full">Start match</button></aside></div></form>`;
  for(const key of ['mode','direction','seconds','rounds']) $(`#${key}`).value=setup[key];
  main.querySelectorAll('[data-count]').forEach(b=>b.addEventListener('click',()=>{readSetup();setup.count=Number(b.dataset.count);renderSetup();main.querySelector(`[data-count="${setup.count}"]`).focus();}));
  $('#setup-form').addEventListener('change',()=>{readSetup();updateSetupSummary();});
  $('#setup-form').addEventListener('submit',e=>{e.preventDefault();readSetup();if(!selectedWords().length){$('#setup-error').textContent='Choose at least one mission.';return;}if(new Set(playerNames().map(normalise)).size!==setup.count){$('#setup-error').textContent='Give each team a different name.';return;}startGame();});
  updateSetupSummary();
}
function readSetup(){
  if(isSolo())setup.soloName=$('#team-0').value.trim()||'Player 1';
  else for(let i=0;i<setup.count;i++)setup.names[i]=$(`#team-${i}`).value.trim()||`Team ${i+1}`;
  setup.topics=[...main.querySelectorAll('[name=topic]:checked')].map(x=>x.value);
  for(const key of ['mode','direction']) setup[key]=$(`#${key}`).value;
  for(const key of ['seconds','rounds']) setup[key]=Number($(`#${key}`).value);
}
function updateSetupSummary(){
  $('#selection-count').textContent=`${selectedWords().length} words selected`;
  $('#direction-field').hidden=setup.mode==='pairs';
  const quick=$('#rounds option[value="3"]');quick.disabled=setup.mode==='mix';
  if(setup.mode==='mix'&&setup.rounds<5){setup.rounds=5;$('#rounds').value='5';}
  $('#mode-description').textContent=setup.mode==='mix'?'All 5 games in every run: quiz, typing, true or false, word scramble and pair match.':MODES[setup.mode].hint;
  $('#game-summary').textContent=`${isSolo()?'Solo':setup.count+' Teams'} · ${setup.count*setup.rounds} challenges in total`;
  $('#setup-error').textContent='';
}
function startGame(pool=selectedWords()){
  stopTimer();
  if(setup.mode==='mix')setup.rounds=Math.max(5,setup.rounds);
  let deck=[];while(deck.length<setup.count*setup.rounds)deck.push(...shuffle(pool));
  let modes=[];while(modes.length<setup.rounds)modes.push(...(setup.mode==='mix'?shuffle(Object.keys(MODES)):[setup.mode]));
  const firstDirection=Math.random()<.5?'de-en':'en-de';
  const directions=Array.from({length:setup.rounds},(_,i)=>setup.direction==='mixed'?(i%2?(firstDirection==='de-en'?'en-de':'de-en'):firstDirection):setup.direction);
  game={modes,directions,teams:playerNames().map((name,index)=>({name,index,score:0,correct:0})),pool,deck:deck.slice(0,setup.count*setup.rounds),turn:0,phase:'ready',missed:[],current:null};
  $('#word-list').disabled=true;renderReady();
}
function activeTeam(){return game.teams[game.turn%game.teams.length];}
function scoreboard(){return `<div class="scoreboard" aria-label="Scoreboard">${game.teams.map((t,i)=>`<div class="score-team team-color-${i} ${game.turn%game.teams.length===i?'active':''}"><span class="team-avatar" aria-hidden="true">${TEAM_ICONS[i]}</span><div class="score-copy"><small>${escapeHTML(t.name)}${game.turn%game.teams.length===i?`<span class="turn-tag">${isSolo()?'Your run':'Your turn'}</span>`:''}</small><strong>${t.score} <span class="points-label">XP</span></strong><div class="hit-track" role="img" aria-label="${t.correct} of ${setup.rounds} correct">${Array.from({length:setup.rounds},(_,n)=>`<span class="${n<t.correct?'hit':''}" aria-hidden="true">${n<t.correct?'★':'·'}</span>`).join('')}</div></div></div>`).join('')}</div>`;}
function gameFrame(){const round=Math.floor(game.turn/game.teams.length);return `<div class="game-top"><div><strong>Level ${round+1} / ${setup.rounds}</strong><p>Challenge ${game.turn+1} of ${game.deck.length}</p></div><div class="round-track" aria-hidden="true">${Array.from({length:setup.rounds},(_,i)=>`<span class="${i<round?'done':i===round?'current':''}">${i<round?'✓':i+1}</span>`).join('')}<span class="finish-flag">🏁</span></div><button id="quit" class="quiet">End match</button></div>${scoreboard()}<section class="arena" id="arena"></section>`;}
function bindQuit(){$('#quit').addEventListener('click',()=>$('#quit-dialog').showModal());}
function renderReady(){
  game.phase='ready';main.innerHTML=gameFrame();bindQuit();
  $('#arena').innerHTML=`<div class="ready team-color-${game.turn%game.teams.length}"><div class="ready-avatar" aria-hidden="true">${TEAM_ICONS[game.turn%game.teams.length]}</div><span class="ready-round">${isSolo()?'Your solo mission':'Next crew up'}</span><h1 class="ready-team">${escapeHTML(activeTeam().name)}</h1><p>${setup.seconds?`You have ${setup.seconds} seconds once the question starts.`:'Take your time to find the answer.'} ${isSolo()?'Trust your instincts and collect as much XP as you can.':'Talk it over and submit one answer together.'}</p><button id="begin-question" class="primary">Start mission</button><p class="hint" style="margin-top:24px">${setup.mode==='mix'?'Arcade Mix · All 5 games':MODES[setup.mode].name} · ${setup.direction==='mixed'?'Both translation directions':setup.direction==='de-en'?'German → English':'English → German'}</p></div>`;
  $('#begin-question').addEventListener('click',renderQuestion);focusHeading();
}
function makeChoices(word,lang){
  const accepted=new Set(answerVariants(word,lang));
  const equivalent=new Set(answerVariants(word,lang==='en'?'de':'en'));
  const candidates=shuffle(VOCAB.filter(v=>v.id!==word.id&&!answerVariants(v,lang).some(a=>accepted.has(a))&&!answerVariants(v,lang==='en'?'de':'en').some(a=>equivalent.has(a))));
  const choices=[{word,correct:true}], labels=new Set([word[lang]]);
  for(const v of candidates){if(!labels.has(v[lang])){choices.push({word:v,correct:false});labels.add(v[lang]);}if(choices.length===4)break;}
  return shuffle(choices);
}
function puzzleAnswer(word,lang){
  if(lang==='en')return (word.en==='(song) lyrics'?'song lyrics':word.en.split(' / ')[0]).replace(/^to /,'');
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
  if(mode==='choice')content=`<div class="answers">${c.choices.map((choice,i)=>`<button class="answer" data-answer="${i}"><span class="key" aria-hidden="true">${i+1}</span><span lang="${target}">${escapeHTML(choice.word[target])}</span></button>`).join('')}</div>`;
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
  if(correct){activeTeam().score+=100+bonus;activeTeam().correct++;}else game.missed.push(...(c.mode==='pairs'?c.pairs.filter(w=>!c.matched.includes(w.id)):[c.word]));
  if(c.mode==='choice')main.querySelectorAll('[data-answer]').forEach(b=>{b.disabled=true;const index=Number(b.dataset.answer);if(c.choices[index].correct){b.classList.add('correct');b.querySelector('.key').textContent='✓';}else if(index===value){b.classList.add('wrong');b.querySelector('.key').textContent='×';}});
  else if(c.mode==='truth')main.querySelectorAll('[data-truth]').forEach(b=>{b.disabled=true;b.classList.add((b.dataset.truth==='true')===c.truth?'correct':'wrong');});
  else if(c.mode==='pairs')main.querySelectorAll('[data-pair]').forEach(b=>b.disabled=true);
  else {$('#typed-answer').disabled=true;$('#answer-form button').disabled=true;}
  main.querySelector('.scoreboard').outerHTML=scoreboard();
  const heading=correct?`Correct! +${100+bonus} XP`:timedOut?'Time is up.':'Not quite. Learn this one!';
  $('#feedback-slot').innerHTML=`<div class="feedback ${correct?'':'fail'}"><span class="feedback-icon" aria-hidden="true">${correct?'🌟':timedOut?'⏰':'💡'}</span><div class="feedback-copy"><h3>${heading}</h3><p><span lang="en">${escapeHTML(c.word.en)}</span> = <span lang="de">${escapeHTML(c.word.de)}</span></p>${correct&&bonus?`<p class="hint">100 XP + ${bonus} speed bonus</p>`:''}${c.mode==='pairs'?c.pairs.filter(w=>w.id!==c.word.id).map(w=>`<p><span lang="en">${escapeHTML(w.en)}</span> = <span lang="de">${escapeHTML(w.de)}</span></p>`).join(''):''}${c.word.note?`<p class="hint">${escapeHTML(c.word.note)}</p>`:''}</div><button class="primary" id="next">${game.turn+1===game.deck.length?'View results':isSolo()?'Next question':'Next team'}</button></div>`;
  $('#announcer').innerHTML=`${escapeHTML(heading)} <span lang="en">${escapeHTML(c.word.en)}</span>: <span lang="de">${escapeHTML(c.word.de)}</span>`;
  if(correct)celebrate();
  $('#next').addEventListener('click',()=>{game.turn++;if(game.turn>=game.deck.length)renderResults();else if(isSolo())renderQuestion();else renderReady();});
  $('#next').focus({preventScroll:true});
}
function renderResults(){
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
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelector('.celebration')?.remove();
  const burst=document.createElement('div');burst.className='celebration';burst.setAttribute('aria-hidden','true');
  burst.innerHTML=Array.from({length:20},(_,i)=>`<span style="--x:${5+(i*37)%90}%;--delay:${i%5*45}ms;--spin:${i%2?240:-180}deg;--drift:${i%2?60:-60}px" class="confetti confetti-${i%4}"></span>`).join('');
  document.body.append(burst);setTimeout(()=>burst.remove(),1100);
}
function renderWords(){const query=normalise($('#word-search').value);const words=VOCAB.filter(w=>normalise(w.en+' '+w.de).includes(query));$('#words-content').innerHTML=words.length?Object.entries(GROUPS).map(([key,name])=>{const list=words.filter(w=>w.group===key);return list.length?`<h3>${name} <span style="font-weight:400">(${list.length})</span></h3>${list.map(w=>`<div class="review-row"><span lang="en">${escapeHTML(w.en)}</span><span lang="de">${escapeHTML(w.de)}</span></div>`).join('')}`:'';}).join(''):'<p>No words found. Try a different search.</p>';}
$('#word-list').addEventListener('click',()=>{renderWords();$('#words-dialog').showModal();});
$('#close-words').addEventListener('click',()=>$('#words-dialog').close());
$('#word-search').addEventListener('input',renderWords);
$('#keep-playing').addEventListener('click',()=>$('#quit-dialog').close());
$('#confirm-quit').addEventListener('click',()=>{$('#quit-dialog').close();renderSetup();focusHeading();});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{announce('Full screen is not available in this browser.');$('#fullscreen').textContent='Full screen unavailable';}});
if(!document.documentElement.requestFullscreen)$('#fullscreen').hidden=true;
document.addEventListener('fullscreenchange',()=>{$('#fullscreen').textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
document.addEventListener('invalid',e=>{if(e.target.matches('input[required]'))e.target.setCustomValidity(e.target.id==='typed-answer'?`Enter a translation in ${game?.current?.target==='de'?'German':'English'}.`:isSolo()?'Enter your player name.':'Enter a team name.');},true);
document.addEventListener('input',e=>{if(e.target.matches('input[required]'))e.target.setCustomValidity('');});
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(game?.phase==='question'&&game.current.mode==='choice'&&/^[1-4]$/.test(e.key)){e.preventDefault();submitAnswer(Number(e.key)-1);}});
renderSetup();

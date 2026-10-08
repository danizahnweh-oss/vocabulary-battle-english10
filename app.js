'use strict';
const $ = s => document.querySelector(s);
const main = $('#main');
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
let setup = {count:2, names:['Team 1','Team 2','Team 3','Team 4'],topics:['cultures','scotland'],mode:'choice',direction:'de-en',seconds:25,rounds:5};
let game = null, timer = null;
function announce(text){$('#announcer').textContent=text;}
function focusHeading(){const h=main.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
function selectedWords(){return VOCAB.filter(v=>setup.topics.includes(v.group)||setup.topics.includes('history')&&!['cultures','scotland'].includes(v.group));}
function stopTimer(){if(timer){clearInterval(timer);timer=null;}}
function renderSetup(){
  stopTimer();game=null;$('#word-list').disabled=false;
  main.innerHTML=`<div class="intro"><div><h1>Eure Wörter. Euer Duell.</h1><p>Teams bilden, Thema wählen und losspielen.<br>Wer holt sich den Vokabelsieg?</p></div><span class="tag">Teamspiel · English 10</span></div>
  <form id="setup-form"><div class="setup-grid"><div>
  <section class="section" aria-labelledby="teams-title"><div class="section-title"><span class="step" aria-hidden="true">01</span><h2 id="teams-title">Wer spielt mit?</h2></div><div class="team-count" role="group" aria-label="Anzahl der Teams">${[2,3,4].map(n=>`<button class="choice" type="button" data-count="${n}" aria-pressed="${setup.count===n}">${n} Teams</button>`).join('')}</div><div class="team-inputs">${Array.from({length:setup.count},(_,i)=>`<div><label for="team-${i}">Team ${i+1}</label><input id="team-${i}" name="team-${i}" maxlength="24" value="${escapeHTML(setup.names[i])}" autocomplete="off" required></div>`).join('')}</div></section>
  <section class="section" aria-labelledby="topics-title"><div class="section-title"><span class="step" aria-hidden="true">02</span><h2 id="topics-title">Was kommt dran?</h2></div>
  ${[['cultures','Across cultures','Same same but different?',11],['scotland','Scottish history','Von „bravery“ bis „enlightenment“',18],['history','History words','Time, relations, development, systems & aggression',VOCAB.length-29]].map(([id,title,sub,count])=>`<label class="topic"><input type="checkbox" name="topic" value="${id}" ${setup.topics.includes(id)?'checked':''}><span class="topic-copy"><strong lang="en">${title}</strong><span>${sub}</span></span><span class="word-count">${count} Wörter</span></label>`).join('')}
  <p class="hint" id="selection-count"></p></section>
  </div><aside class="rules" aria-labelledby="rules-title"><h2 id="rules-title">Eure Spielregeln</h2>
  <div class="field"><label for="mode">Spielmodus</label><select id="mode"><option value="choice">Quiz · Antwort auswählen</option><option value="type">Schreiben · Englisch eintippen</option><option value="mix">Mix · Quiz & Schreiben</option></select></div>
  <div class="field" id="direction-field"><label for="direction">Übersetzungsrichtung</label><select id="direction"><option value="de-en">Deutsch → Englisch</option><option value="en-de">Englisch → Deutsch</option></select></div>
  <div class="field"><label for="seconds">Zeit pro Frage</label><select id="seconds"><option value="15">15 Sekunden · schnell</option><option value="25">25 Sekunden · normal</option><option value="40">40 Sekunden · entspannt</option><option value="0">Ohne Zeitlimit</option></select></div>
  <div class="field"><label for="rounds">Fragen pro Team</label><select id="rounds"><option value="3">3 · kurze Runde</option><option value="5">5 · Standard</option><option value="10">10 · große Runde</option></select></div>
  <p class="rules-note">100 Punkte pro richtiger Antwort.<br>Mit Zeitlimit: bis zu 50 Punkte Tempobonus. Keine Minuspunkte.</p>
  <p class="summary-line" id="game-summary"></p><p class="hint error" id="setup-error" role="alert"></p><button type="submit" class="primary full">Wettbewerb starten</button></aside></div></form>`;
  for(const key of ['mode','direction','seconds','rounds']) $(`#${key}`).value=setup[key];
  main.querySelectorAll('[data-count]').forEach(b=>b.addEventListener('click',()=>{readSetup();setup.count=Number(b.dataset.count);renderSetup();main.querySelector(`[data-count="${setup.count}"]`).focus();}));
  $('#setup-form').addEventListener('change',()=>{readSetup();updateSetupSummary();});
  $('#setup-form').addEventListener('submit',e=>{e.preventDefault();readSetup();if(!selectedWords().length){$('#setup-error').textContent='Wähle mindestens ein Thema aus.';return;}if(new Set(setup.names.slice(0,setup.count).map(normalise)).size!==setup.count){$('#setup-error').textContent='Bitte gib jedem Team einen eigenen Namen.';return;}startGame();});
  updateSetupSummary();
}
function readSetup(){
  for(let i=0;i<setup.count;i++)setup.names[i]=$(`#team-${i}`).value.trim()||`Team ${i+1}`;
  setup.topics=[...main.querySelectorAll('[name=topic]:checked')].map(x=>x.value);
  for(const key of ['mode','direction']) setup[key]=$(`#${key}`).value;
  for(const key of ['seconds','rounds']) setup[key]=Number($(`#${key}`).value);
}
function updateSetupSummary(){
  $('#selection-count').textContent=`${selectedWords().length} Vokabeln ausgewählt`;
  $('#game-summary').textContent=`${setup.count} Teams · ${setup.count*setup.rounds} Fragen insgesamt`;
  $('#direction-field').hidden=setup.mode!=='choice';
  $('#setup-error').textContent='';
}
function startGame(pool=selectedWords()){
  stopTimer();
  let deck=[];while(deck.length<setup.count*setup.rounds)deck.push(...shuffle(pool));
  game={teams:setup.names.slice(0,setup.count).map(name=>({name,score:0,correct:0})),pool,deck:deck.slice(0,setup.count*setup.rounds),turn:0,phase:'ready',missed:[],current:null};
  $('#word-list').disabled=true;renderReady();
}
function activeTeam(){return game.teams[game.turn%game.teams.length];}
function scoreboard(){return `<div class="scoreboard" aria-label="Spielstand">${game.teams.map((t,i)=>`<div class="score-team ${game.turn%game.teams.length===i?'active':''}"><small>${escapeHTML(t.name)}${game.turn%game.teams.length===i?'<span class="turn-tag">Am Zug</span>':''}</small><strong>${t.score} <span style="font-size:.875rem;font-weight:500">Punkte</span></strong></div>`).join('')}</div>`;}
function gameFrame(){return `<div class="game-top"><div><strong>Runde ${Math.floor(game.turn/game.teams.length)+1} von ${setup.rounds}</strong><p>Frage ${game.turn+1} von ${game.deck.length}</p></div><button id="quit" class="quiet">Spiel beenden</button></div>${scoreboard()}<section class="arena" id="arena"></section>`;}
function bindQuit(){$('#quit').addEventListener('click',()=>$('#quit-dialog').showModal());}
function renderReady(){
  game.phase='ready';main.innerHTML=gameFrame();bindQuit();
  $('#arena').innerHTML=`<div class="ready"><span class="ready-round">Ihr seid dran</span><h1 class="ready-team">${escapeHTML(activeTeam().name)}</h1><p>${setup.seconds?`Ihr habt ${setup.seconds} Sekunden ab dem Start der Frage.`:'Nehmt euch Zeit für eure Antwort.'} Besprecht euch und gebt gemeinsam eine Antwort ab.</p><button id="begin-question" class="primary">Wir sind bereit</button><p class="hint" style="margin-top:24px">${setup.mode==='type'?'Schreibmodus · Deutsch → Englisch':setup.mode==='mix'?'Mix · Auswahl- und Schreibfragen wechseln je Runde':'Quiz · '+(setup.direction==='de-en'?'Deutsch → Englisch':'Englisch → Deutsch')}</p></div>`;
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
function renderQuestion(){
  const word=game.deck[game.turn];
  const mode=setup.mode==='mix'?(Math.floor(game.turn/game.teams.length)%2?'type':'choice'):setup.mode;
  const direction=mode==='type'||setup.mode==='mix'?'de-en':setup.direction;
  const target=direction==='de-en'?'en':'de', prompt=direction==='de-en'?'de':'en';
  game.phase='question';game.current={word,mode,target,prompt,choices:makeChoices(word,target),deadline:0};
  main.innerHTML=gameFrame();bindQuit();
  $('#arena').innerHTML=`<div class="question-meta"><span class="direction">${mode==='type'?'Schreibe das englische Wort':'Wähle die richtige Übersetzung'}<br><span style="font-weight:400">${escapeHTML(GROUPS[word.group])}</span></span><div><div class="timer" id="timer" role="timer" aria-label="Verbleibende Zeit">${setup.seconds?setup.seconds+' s':'Ohne Limit'}</div>${setup.seconds?'<div class="timer-track" aria-hidden="true"><div class="timer-fill" id="timer-fill"></div></div>':''}</div></div>
  <h1 class="question-title ${word[prompt].length>65?'long':''}" lang="${prompt}">${escapeHTML(word[prompt])}</h1>
  ${mode==='choice'?`<div class="answers">${game.current.choices.map((choice,i)=>`<button class="answer" data-answer="${i}"><span class="key" aria-hidden="true">${i+1}</span><span lang="${target}">${escapeHTML(choice.word[target])}</span></button>`).join('')}</div>`:`<form id="answer-form"><label for="typed-answer">Eure Antwort auf Englisch</label><div class="typing-row"><input class="typed-input" id="typed-answer" autocomplete="off" autocapitalize="none" spellcheck="false" lang="en" placeholder="Englische Übersetzung" required><button class="primary" type="submit">Antwort prüfen</button></div><p class="hint">Eine passende Übersetzung genügt. „to“ ist bei Verben optional.</p></form>`}
  <div id="feedback-slot"></div><p class="keyboard-hint">${mode==='choice'?'Tastatur: 1, 2, 3 oder 4 zum Antworten.':'Mit Enter die Antwort abgeben.'}</p>`;
  if(mode==='choice')main.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>submitAnswer(Number(b.dataset.answer))));
  else $('#answer-form').addEventListener('submit',e=>{e.preventDefault();if($('#typed-answer').value.trim())submitAnswer($('#typed-answer').value);});
  if(mode==='type')$('#typed-answer').focus();else focusHeading();
  game.current.deadline=performance.now()+setup.seconds*1000;
  if(setup.seconds)timer=setInterval(tick,100);
}
function tick(){
  if(!game||game.phase!=='question'){stopTimer();return;}
  const remaining=Math.max(0,game.current.deadline-performance.now());
  $('#timer').textContent=`${Math.ceil(remaining/1000)} s`;$('#timer-fill').style.transform=`scaleX(${remaining/(setup.seconds*1000)})`;
  $('#timer').classList.toggle('urgent',remaining<=5000);
  if(remaining<=5000&&!game.current.announced){game.current.announced=true;announce('Noch fünf Sekunden.');}
  if(remaining<=0)submitAnswer(null);
}
function submitAnswer(value){
  if(!game||game.phase!=='question')return;
  const c=game.current;const remaining=setup.seconds?Math.max(0,c.deadline-performance.now()):0;
  const timedOut=setup.seconds>0&&remaining<=0;
  if(timedOut)value=null;
  stopTimer();game.phase='feedback';
  const correct=value!==null&&(c.mode==='choice'?c.choices[value]?.correct:answerVariants(c.word,c.target).includes(normalise(value)));
  const bonus=correct&&setup.seconds?Math.min(50,Math.ceil(50*remaining/(setup.seconds*1000))):0;
  if(correct){activeTeam().score+=100+bonus;activeTeam().correct++;}else game.missed.push(c.word);
  if(c.mode==='choice')main.querySelectorAll('[data-answer]').forEach(b=>{b.disabled=true;const index=Number(b.dataset.answer);if(c.choices[index].correct){b.classList.add('correct');b.querySelector('.key').textContent='✓';}else if(index===value){b.classList.add('wrong');b.querySelector('.key').textContent='×';}});
  else {$('#typed-answer').disabled=true;$('#answer-form button').disabled=true;}
  main.querySelector('.scoreboard').outerHTML=scoreboard();
  const heading=correct?`Richtig! +${100+bonus} Punkte`:timedOut?'Die Zeit ist um.':'Noch nicht richtig.';
  $('#feedback-slot').innerHTML=`<div class="feedback ${correct?'':'fail'}"><div><h3>${heading}</h3><p><span lang="en">${escapeHTML(c.word.en)}</span> = ${escapeHTML(c.word.de)}</p>${correct&&bonus?`<p class="hint">100 Punkte + ${bonus} Tempobonus</p>`:''}${c.word.note?`<p class="hint">${escapeHTML(c.word.note)}</p>`:''}</div><button class="primary" id="next">${game.turn+1===game.deck.length?'Ergebnis ansehen':'Nächstes Team'}</button></div>`;
  announce(`${heading} ${c.word.en}: ${c.word.de}`);
  $('#next').addEventListener('click',()=>{game.turn++;if(game.turn>=game.deck.length)renderResults();else renderReady();});
  $('#next').focus({preventScroll:true});
}
function renderResults(){
  stopTimer();game.phase='results';$('#word-list').disabled=false;
  const sorted=[...game.teams].sort((a,b)=>b.score-a.score);const top=sorted[0].score;
  const winners=sorted.filter(t=>t.score===top);const missed=[...new Map(game.missed.map(w=>[w.id,w])).values()];
  const title=top===0?'Neue Runde, neue Chance!':winners.length>1?'Punktgleich an der Spitze!':`${escapeHTML(winners[0].name)} gewinnt!`;
  main.innerHTML=`<div class="results-heading"><span class="tag">Wettbewerb beendet</span><h1>${title}</h1><p>${top===0?'Schaut euch die Wörter noch einmal an und startet eine neue Runde.':winners.length>1?winners.map(t=>escapeHTML(t.name)).join(' & ')+` teilen sich mit ${top} Punkten den Sieg.`:'Stark gespielt. Hier ist euer Ergebnis.'}</p></div>
  <div class="ranking">${sorted.map((t,i)=>`<div class="ranking-row ${t.score===top&&top>0?'winner':''}"><span class="rank">${sorted.findIndex(x=>x.score===t.score)+1}</span><div class="rank-name"><strong>${escapeHTML(t.name)}</strong><p>${t.correct} von ${setup.rounds} richtig</p></div><span class="rank-points">${t.score} <span style="font-size:.875rem;font-weight:400">Punkte</span></span></div>`).join('')}</div>
  <div class="actions result-actions"><button class="primary" id="play-again">Revanche spielen</button>${missed.length?'<button class="secondary" id="retry-missed">Schwierige Wörter üben</button>':''}<button class="quiet" id="new-game">Teams & Regeln ändern</button></div>
  ${missed.length?`<details class="review"><summary>${missed.length} schwierige ${missed.length===1?'Vokabel':'Vokabeln'} nachlesen</summary>${missed.map(w=>`<div class="review-row"><span lang="en">${escapeHTML(w.en)}</span><span>${escapeHTML(w.de)}</span></div>`).join('')}</details>`:'<p class="hint" style="text-align:center;margin-top:32px">Alle Wörter richtig beantwortet. Perfekte Teamarbeit!</p>'}`;
  $('#play-again').addEventListener('click',()=>startGame(game.pool));
  $('#new-game').addEventListener('click',()=>{renderSetup();focusHeading();});
  if(missed.length)$('#retry-missed').addEventListener('click',()=>startGame(missed));
  focusHeading();
}
function renderWords(){const query=normalise($('#word-search').value);const words=VOCAB.filter(w=>normalise(w.en+' '+w.de).includes(query));$('#words-content').innerHTML=words.length?Object.entries(GROUPS).map(([key,name])=>{const list=words.filter(w=>w.group===key);return list.length?`<h3>${name} <span style="font-weight:400">(${list.length})</span></h3>${list.map(w=>`<div class="review-row"><span lang="en">${escapeHTML(w.en)}</span><span>${escapeHTML(w.de)}</span></div>`).join('')}`:'';}).join(''):'<p>Kein Wort gefunden. Versuche einen anderen Suchbegriff.</p>';}
$('#word-list').addEventListener('click',()=>{renderWords();$('#words-dialog').showModal();});
$('#close-words').addEventListener('click',()=>$('#words-dialog').close());
$('#word-search').addEventListener('input',renderWords);
$('#keep-playing').addEventListener('click',()=>$('#quit-dialog').close());
$('#confirm-quit').addEventListener('click',()=>{$('#quit-dialog').close();renderSetup();focusHeading();});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{announce('Vollbild ist in diesem Browser nicht verfügbar.');$('#fullscreen').textContent='Vollbild nicht verfügbar';}});
if(!document.documentElement.requestFullscreen)$('#fullscreen').hidden=true;
document.addEventListener('fullscreenchange',()=>{$('#fullscreen').textContent=document.fullscreenElement?'Vollbild verlassen':'Vollbild';});
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(game?.phase==='question'&&game.current.mode==='choice'&&/^[1-4]$/.test(e.key)){e.preventDefault();submitAnswer(Number(e.key)-1);}});
renderSetup();
